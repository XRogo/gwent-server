(function () {
    const PROFILE_KEY = 'gwent_local_profile_v1';
    const DECK_META_KEY = 'gwent_deck_updated_at_v1';
    const FACTIONS = ['1', '2', '3', '4', '5'];

    function randomNickname() {
        return 'Ciri ' + String(Math.floor(10000 + Math.random() * 90000));
    }

    function getLocalProfile() {
        let profile;
        try {
            profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
        } catch (error) {
            console.warn('[ACCOUNT] Nie można odczytać lokalnego profilu; tworzę nowy.', error);
        }

        if (!profile || typeof profile !== 'object' ||
            typeof profile.nickname !== 'string' || !profile.nickname.trim()) {
            profile = {
                localId: (window.crypto && crypto.randomUUID)
                    ? crypto.randomUUID()
                    : Date.now().toString(36) + Math.random().toString(36).slice(2),
                nickname: localStorage.getItem('nickname') || randomNickname(),
                createdAt: new Date().toISOString()
            };
        }

        profile.nickname = profile.nickname.trim().slice(0, 24) || randomNickname();
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        localStorage.setItem('nickname', profile.nickname);
        return profile;
    }

    function getJson(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key) || '{}');
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        } catch (error) {
            console.warn(`[ACCOUNT] Nie można odczytać ${key}.`, error);
            return {};
        }
    }

    function setLocalNickname(nickname) {
        const profile = getLocalProfile();
        profile.nickname = nickname;
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        localStorage.setItem('nickname', nickname);
        window.gwentAccountState.profile = profile;
    }

    const state = {
        profile: getLocalProfile(),
        user: null,
        configured: false,
        error: null
    };
    window.gwentAccountState = state;
    window.gwentSetNickname = setLocalNickname;

    async function putDeck(factionId, deck) {
        const response = await fetch(`/api/me/decks/${factionId}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dowodca: deck.dowodca, karty: deck.karty })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        const result = await response.json();
        return result.deck;
    }

    async function mergeDecks(remoteDecks) {
        const localDecks = getJson('gwint_talie');
        const metadata = getJson(DECK_META_KEY);
        let localChanged = false;

        for (const factionId of FACTIONS) {
            const local = localDecks[factionId];
            const remote = remoteDecks && remoteDecks[factionId];
            if (!local && !remote) continue;

            if (!remote && local) {
                const saved = await putDeck(factionId, local);
                metadata[factionId] = saved.updatedAt;
                continue;
            }

            const localTime = Date.parse(metadata[factionId] || '');
            const remoteTime = Date.parse(remote.updatedAt || '');
            if (local && Number.isFinite(localTime) && localTime > remoteTime) {
                const saved = await putDeck(factionId, local);
                metadata[factionId] = saved.updatedAt;
            } else {
                localDecks[factionId] = { dowodca: remote.dowodca, karty: remote.karty };
                metadata[factionId] = remote.updatedAt;
                localChanged = true;
            }
        }

        if (localChanged) localStorage.setItem('gwint_talie', JSON.stringify(localDecks));
        localStorage.setItem(DECK_META_KEY, JSON.stringify(metadata));
    }

    async function initialize() {
        try {
            const statusResponse = await fetch('/api/auth/status', { credentials: 'same-origin' });
            if (!statusResponse.ok) throw new Error(`HTTP ${statusResponse.status}`);
            const status = await statusResponse.json();
            state.configured = Boolean(status.configured);
            if (!state.configured) return state;

            const response = await fetch('/api/me', { credentials: 'same-origin' });
            if (response.status === 401) return state;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            state.user = await response.json();
            setLocalNickname(state.user.nickname);
            await mergeDecks(state.user.decks || {});
        } catch (error) {
            state.error = error.message;
            console.error('[ACCOUNT] Nie udało się pobrać profilu lub zsynchronizować talii.', error);
        }
        return state;
    }

    window.gwentAccountReady = initialize();
    window.gwentSyncSavedDeck = async function (factionId, deck) {
        await window.gwentAccountReady;
        if (!state.user) return;
        try {
            const saved = await putDeck(String(factionId), deck);
            const metadata = getJson(DECK_META_KEY);
            metadata[factionId] = saved.updatedAt;
            localStorage.setItem(DECK_META_KEY, JSON.stringify(metadata));
        } catch (error) {
            console.error('[ACCOUNT] Talia została zapisana lokalnie, ale nie zsynchronizowała się z kontem.', error);
            window.dispatchEvent(new CustomEvent('gwent-account-sync-error', { detail: error.message }));
        }
    };
})();
