const crypto = require('crypto');
const { Pool } = require('pg');

const SESSION_COOKIE = 'gwent_account_session';
const OAUTH_STATE_COOKIE = 'gwent_oauth_state';
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

let pool;

function getPool() {
    if (!process.env.DATABASE_URL) {
        const error = new Error('DATABASE_URL is not configured');
        error.status = 503;
        throw error;
    }

    if (!pool) {
        pool = new Pool({ connectionString: process.env.DATABASE_URL });
    }

    return pool;
}

function publicUrl() {
    if (!process.env.PUBLIC_URL) {
        const error = new Error('PUBLIC_URL is not configured');
        error.status = 503;
        throw error;
    }
    const url = new URL(process.env.PUBLIC_URL);
    if (!['http:', 'https:'].includes(url.protocol) ||
        url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
        const error = new Error('PUBLIC_URL must be an origin without a path');
        error.status = 503;
        throw error;
    }
    return url.origin;
}

function isConfigured() {
    if (!(
        process.env.DATABASE_URL &&
        process.env.PUBLIC_URL &&
        process.env.DISCORD_CLIENT_ID &&
        process.env.DISCORD_CLIENT_SECRET
    )) return false;

    try {
        publicUrl();
        return true;
    } catch (_) {
        return false;
    }
}

function cookieOptions(maxAge) {
    let secure = process.env.NODE_ENV === 'production';
    try {
        secure = secure || new URL(publicUrl()).protocol === 'https:';
    } catch (_) {
        // The configuration endpoint reports missing/invalid public URLs separately.
    }

    return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function setCookie(res, name, value, maxAge) {
    res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; ${cookieOptions(maxAge)}`);
}

function clearCookie(res, name) {
    setCookie(res, name, '', 0);
}

function parseCookies(req) {
    const header = req.headers.cookie || '';
    return Object.fromEntries(header.split(';').map(part => {
        const separator = part.indexOf('=');
        if (separator < 0) return ['', ''];
        const key = part.slice(0, separator).trim();
        try {
            return [key, decodeURIComponent(part.slice(separator + 1).trim())];
        } catch (_) {
            return [key, ''];
        }
    }).filter(([key]) => key));
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function sameOrigin(req, res, next) {
    let expectedOrigin;
    try {
        expectedOrigin = new URL(publicUrl()).origin;
    } catch (_) {
        return res.status(503).json({ error: 'Ustaw PUBLIC_URL, aby włączyć konta.' });
    }

    if (req.get('origin') !== expectedOrigin) {
        return res.status(403).json({ error: 'Nieprawidłowe źródło żądania.' });
    }
    next();
}

function handleError(res, route, error) {
    console.error(`[ACCOUNT] ${route}:`, error);
    const status = Number.isInteger(error.status) ? error.status : 500;
    const message = status === 503
        ? 'Logowanie nie jest skonfigurowane na serwerze.'
        : 'Nie udało się wykonać operacji na koncie.';
    res.status(status).json({ error: message });
}

async function getAccount(req) {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (!token) return null;

    const result = await getPool().query(
        `SELECT a.id, a.nickname, a.avatar, a.decks_json
         FROM account_sessions s
         JOIN accounts a ON a.id = s.account_id
         WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
        [hashToken(token)]
    );
    return result.rows[0] || null;
}

function requireAccount(handler) {
    return async (req, res) => {
        try {
            const account = await getAccount(req);
            if (!account) return res.status(401).json({ error: 'Zaloguj się, aby kontynuować.' });
            req.account = account;
            await handler(req, res);
        } catch (error) {
            handleError(res, req.path, error);
        }
    };
}

function normalizeCardId(value) {
    if (typeof value !== 'string' && !Number.isSafeInteger(value)) return null;
    const id = String(value);
    return /^\d{1,12}$/.test(id) ? id : null;
}

function getDeckInput(req) {
    const { dowodca, karty } = req.body || {};
    const leader = dowodca == null ? null : normalizeCardId(dowodca);
    if (dowodca != null && !leader) return null;
    if (!Array.isArray(karty) || karty.length > 80) return null;

    const cards = karty.map(normalizeCardId);
    if (cards.some(card => !card)) return null;
    return { dowodca: leader, karty: cards };
}

async function initializeAccountsDatabase() {
    await getPool().query(`
        CREATE TABLE IF NOT EXISTS accounts (
            id BIGSERIAL PRIMARY KEY,
            provider TEXT NOT NULL,
            provider_id TEXT NOT NULL,
            nickname VARCHAR(32) NOT NULL,
            avatar TEXT,
            decks_json JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (provider, provider_id)
        );

        CREATE TABLE IF NOT EXISTS account_sessions (
            token_hash CHAR(64) PRIMARY KEY,
            account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS account_sessions_expires_at_idx
            ON account_sessions (expires_at);
    `);
}

function registerAccountRoutes(app) {
    app.get('/api/auth/status', (_req, res) => {
        res.json({ configured: isConfigured() });
    });

    app.get('/auth/discord', (req, res) => {
        if (!isConfigured()) {
            return res.redirect('/beta_wejsciowa.html?account=unavailable');
        }

        const state = crypto.randomBytes(32).toString('hex');
        setCookie(res, OAUTH_STATE_COOKIE, state, 10 * 60);
        const redirectUri = `${publicUrl()}/auth/discord/callback`;
        const authorizationUrl = new URL('https://discord.com/oauth2/authorize');
        authorizationUrl.search = new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'identify',
            state
        }).toString();
        res.redirect(authorizationUrl.toString());
    });

    app.get('/auth/discord/callback', async (req, res) => {
        const expectedState = parseCookies(req)[OAUTH_STATE_COOKIE];
        clearCookie(res, OAUTH_STATE_COOKIE);

        if (req.query.error || !req.query.code || !expectedState || typeof req.query.state !== 'string') {
            return res.redirect('/beta_wejsciowa.html?account=login-error');
        }

        const providedState = req.query.state;
        const expected = Buffer.from(expectedState);
        const provided = Buffer.from(providedState);
        if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
            return res.redirect('/beta_wejsciowa.html?account=login-error');
        }

        try {
            const redirectUri = `${publicUrl()}/auth/discord/callback`;
            const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: process.env.DISCORD_CLIENT_ID,
                    client_secret: process.env.DISCORD_CLIENT_SECRET,
                    grant_type: 'authorization_code',
                    code: String(req.query.code),
                    redirect_uri: redirectUri
                })
            });
            const tokenData = await tokenResponse.json();
            if (!tokenResponse.ok || !tokenData.access_token) {
                throw new Error(`Discord token exchange failed (${tokenResponse.status})`);
            }

            const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });
            const discordUser = await userResponse.json();
            if (!userResponse.ok || !discordUser.id || !discordUser.username) {
                throw new Error(`Discord profile request failed (${userResponse.status})`);
            }

            const avatar = discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
                : null;
            const discordNickname = (discordUser.global_name || discordUser.username).slice(0, 24);
            const accountResult = await getPool().query(
                `INSERT INTO accounts (provider, provider_id, nickname, avatar)
                 VALUES ('discord', $1, $2, $3)
                 ON CONFLICT (provider, provider_id)
                 DO UPDATE SET avatar = EXCLUDED.avatar
                 RETURNING id`,
                [String(discordUser.id), discordNickname, avatar]
            );

            const sessionToken = crypto.randomBytes(32).toString('hex');
            await getPool().query(
                `INSERT INTO account_sessions (token_hash, account_id, expires_at)
                 VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
                [hashToken(sessionToken), accountResult.rows[0].id]
            );
            setCookie(res, SESSION_COOKIE, sessionToken, SESSION_TTL_SECONDS);
            res.redirect('/beta_wejsciowa.html?account=connected');
        } catch (error) {
            handleError(res, '/auth/discord/callback', error);
        }
    });

    app.get('/api/me', async (req, res) => {
        try {
            if (!isConfigured()) {
                return res.status(401).json({ error: 'Konta nie są skonfigurowane.' });
            }
            const account = await getAccount(req);
            if (!account) return res.status(401).json({ error: 'Nie jesteś zalogowany.' });
            res.json({
                nickname: account.nickname,
                avatar: account.avatar,
                decks: account.decks_json || {}
            });
        } catch (error) {
            handleError(res, '/api/me', error);
        }
    });

    app.patch('/api/me', sameOrigin, requireAccount(async (req, res) => {
        const nickname = typeof (req.body && req.body.nickname) === 'string'
            ? req.body.nickname.trim()
            : '';
        if (!nickname || nickname.length > 24 || /[\u0000-\u001f\u007f]/.test(nickname)) {
            return res.status(400).json({ error: 'Nick musi mieć od 1 do 24 znaków.' });
        }

        const result = await getPool().query(
            `UPDATE accounts SET nickname = $1, updated_at = NOW()
             WHERE id = $2 RETURNING nickname, avatar, decks_json`,
            [nickname, req.account.id]
        );
        res.json({
            nickname: result.rows[0].nickname,
            avatar: result.rows[0].avatar,
            decks: result.rows[0].decks_json || {}
        });
    }));

    app.put('/api/me/decks/:factionId', sameOrigin, requireAccount(async (req, res) => {
        if (!/^[1-5]$/.test(req.params.factionId)) {
            return res.status(400).json({ error: 'Nieprawidłowy numer frakcji.' });
        }
        const deck = getDeckInput(req);
        if (!deck) return res.status(400).json({ error: 'Nieprawidłowy format talii.' });

        const savedDeck = { ...deck, updatedAt: new Date().toISOString() };
        const result = await getPool().query(
            `UPDATE accounts
             SET decks_json = jsonb_set(decks_json, ARRAY[$1]::text[], $2::jsonb, true),
                 updated_at = NOW()
             WHERE id = $3
             RETURNING decks_json`,
            [req.params.factionId, JSON.stringify(savedDeck), req.account.id]
        );
        res.json({ deck: result.rows[0].decks_json[req.params.factionId] });
    }));

    app.post('/auth/logout', sameOrigin, async (req, res) => {
        try {
            const token = parseCookies(req)[SESSION_COOKIE];
            if (token && process.env.DATABASE_URL) {
                await getPool().query(
                    'DELETE FROM account_sessions WHERE token_hash = $1',
                    [hashToken(token)]
                );
            }
            clearCookie(res, SESSION_COOKIE);
            res.status(204).end();
        } catch (error) {
            handleError(res, '/auth/logout', error);
        }
    });
}

module.exports = { initializeAccountsDatabase, registerAccountRoutes };
