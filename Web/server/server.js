/* =====================================================
   NoteDay Unified Server
   Statik dosya sunumu + Gerçek zamanlı sohbet
   Express + Socket.io + sql.js
   ===================================================== */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'noteday_super_secret_key_2026';
const DB_PATH = path.join(__dirname, 'noteday_chat.db');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

/* ========== STATIC FILE SERVING ========== */
// Proje kök dizinini sun (server/ klasörünün bir üst dizini)
const PROJECT_ROOT = path.join(__dirname, '..');
app.use(express.static(PROJECT_ROOT));

/* ========== DATABASE ========== */
let db;

function saveDB() {
    try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); } catch (e) { console.error('[DB] Save error:', e); }
}

// Auto-save every 30 seconds
setInterval(saveDB, 30000);

function q(sql, params) { return db.exec(sql, params); }
function run(sql, params) { db.run(sql, params || []); }
function get(sql, params) {
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row; }
    stmt.free(); return null;
}
function all(sql, params) {
    const stmt = db.prepare(sql);
    if (params) stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free(); return rows;
}

async function initDB() {
    const SQL = await initSqlJs();
    try {
        if (fs.existsSync(DB_PATH)) {
            const buf = fs.readFileSync(DB_PATH);
            db = new SQL.Database(buf);
            console.log('[DB] Loaded existing database');
        } else {
            db = new SQL.Database();
            console.log('[DB] Created new database');
        }
    } catch (e) {
        db = new SQL.Database();
        console.log('[DB] Created fresh database (load failed)');
    }

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        createdAt TEXT DEFAULT (datetime('now')),
        lastSeen TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        teamId TEXT DEFAULT NULL,
        name TEXT DEFAULT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS conversation_members (
        conversationId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        joinedAt TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (conversationId, userId)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        text TEXT,
        imageBase64 TEXT DEFAULT NULL,
        replyToId INTEGER DEFAULT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS message_reads (
        messageId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        readAt TEXT DEFAULT (datetime('now')),
        PRIMARY KEY (messageId, userId)
    )`);

    try { db.run('CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversationId)'); } catch(e){}
    try { db.run('CREATE INDEX IF NOT EXISTS idx_cm_user ON conversation_members(userId)'); } catch(e){}
    try { db.run('ALTER TABLE messages ADD COLUMN edited INTEGER DEFAULT 0'); } catch(e){}

    saveDB();
    console.log('[DB] Tables ready');
}

/* ========== AUTH MIDDLEWARE ========== */
function auth(req, res, next) {
    const h = req.headers['authorization'];
    const token = h && h.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token gerekli' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Geçersiz token' });
        req.user = decoded;
        next();
    });
}

/* ========== AUTH ROUTES ========== */
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;
        if (!email || !firstName || !lastName || !password) return res.status(400).json({ error: 'Tüm alanlar gerekli' });
        const existing = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
        if (existing) return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
        const hash = bcrypt.hashSync(password, 10);
        run('INSERT INTO users (email, firstName, lastName, password) VALUES (?, ?, ?, ?)', [email.toLowerCase(), firstName, lastName, hash]);
        const user = get('SELECT id, email, firstName, lastName FROM users WHERE email = ?', [email.toLowerCase()]);
        saveDB();
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user });
    } catch (err) { console.error('[Auth]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
        const user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
        run('UPDATE users SET lastSeen = datetime("now") WHERE id = ?', [user.id]);
        saveDB();
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } });
    } catch (err) { console.error('[Auth]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

app.post('/api/auth/sync', (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;
        if (!email) return res.status(400).json({ error: 'E-posta gerekli' });
        let user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        if (!user) {
            const hash = bcrypt.hashSync(password || 'noteday_default', 10);
            run('INSERT INTO users (email, firstName, lastName, password) VALUES (?, ?, ?, ?)', [email.toLowerCase(), firstName || 'User', lastName || '', hash]);
            user = get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
        } else {
            run('UPDATE users SET lastSeen = datetime("now") WHERE id = ?', [user.id]);
        }
        saveDB();
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar } });
    } catch (err) { console.error('[Auth]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

app.get('/api/auth/me', auth, (req, res) => {
    const user = get('SELECT id, email, firstName, lastName, avatar, lastSeen FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    res.json({ user });
});

/* ========== USER SEARCH ========== */
app.get('/api/users/search', auth, (req, res) => {
    const q2 = '%' + (req.query.q || '') + '%';
    const users = all('SELECT id, email, firstName, lastName, avatar, lastSeen FROM users WHERE (email LIKE ? OR firstName LIKE ? OR lastName LIKE ?) AND id != ? LIMIT 20', [q2, q2, q2, req.user.id]);
    res.json({ users });
});

/* ========== CONVERSATION ROUTES ========== */
app.get('/api/conversations', auth, (req, res) => {
    try {
        const convs = all(`SELECT c.*, (SELECT COUNT(*) FROM conversation_members WHERE conversationId = c.id) as memberCount
            FROM conversations c JOIN conversation_members cm ON cm.conversationId = c.id WHERE cm.userId = ? ORDER BY c.id DESC`, [req.user.id]);
        const result = convs.map(conv => {
            const members = all('SELECT u.id, u.email, u.firstName, u.lastName, u.avatar, u.lastSeen FROM conversation_members cm JOIN users u ON u.id = cm.userId WHERE cm.conversationId = ?', [conv.id]);
            const lastMsg = get('SELECT m.*, u.firstName, u.lastName FROM messages m JOIN users u ON u.id = m.senderId WHERE m.conversationId = ? ORDER BY m.createdAt DESC LIMIT 1', [conv.id]);
            const unread = get('SELECT COUNT(*) as count FROM messages m WHERE m.conversationId = ? AND m.senderId != ? AND NOT EXISTS (SELECT 1 FROM message_reads mr WHERE mr.messageId = m.id AND mr.userId = ?)', [conv.id, req.user.id, req.user.id]);
            let displayName = conv.name;
            let participantId = null;
            let participantLastSeen = null;
            if (conv.type === 'personal') {
                const other = members.find(m => m.id !== req.user.id);
                displayName = other ? (other.firstName + ' ' + other.lastName) : 'Bilinmeyen';
                participantId = other ? other.id : null;
                participantLastSeen = other ? other.lastSeen : null;
            }
            return { ...conv, displayName, participantId, participantLastSeen, members, lastMessage: lastMsg, unreadCount: unread ? unread.count : 0 };
        });
        res.json({ conversations: result });
    } catch (err) { console.error('[Conv]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

app.post('/api/conversations/personal', auth, (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId gerekli' });
        const existing = get(`SELECT c.id FROM conversations c WHERE c.type = 'personal'
            AND EXISTS (SELECT 1 FROM conversation_members WHERE conversationId = c.id AND userId = ?)
            AND EXISTS (SELECT 1 FROM conversation_members WHERE conversationId = c.id AND userId = ?)
            AND (SELECT COUNT(*) FROM conversation_members WHERE conversationId = c.id) = 2`, [req.user.id, userId]);
        if (existing) return res.json({ conversationId: existing.id, existing: true });
        run('INSERT INTO conversations (type) VALUES (?)', ['personal']);
        const conv = get('SELECT last_insert_rowid() as id');
        const convId = conv.id;
        run('INSERT OR IGNORE INTO conversation_members (conversationId, userId) VALUES (?, ?)', [convId, req.user.id]);
        run('INSERT OR IGNORE INTO conversation_members (conversationId, userId) VALUES (?, ?)', [convId, userId]);
        saveDB();
        res.json({ conversationId: convId, existing: false });
    } catch (err) { console.error('[Conv]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

app.post('/api/conversations/team', auth, (req, res) => {
    try {
        const { teamId, teamName, memberEmails } = req.body;
        if (!teamId) return res.status(400).json({ error: 'teamId gerekli' });
        let conv = get("SELECT id FROM conversations WHERE type = 'team' AND teamId = ?", [teamId]);
        if (conv) {
            if (memberEmails && Array.isArray(memberEmails)) {
                memberEmails.forEach(email => {
                    const u = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
                    if (u) run('INSERT OR IGNORE INTO conversation_members (conversationId, userId) VALUES (?, ?)', [conv.id, u.id]);
                });
                saveDB();
            }
            return res.json({ conversationId: conv.id, existing: true });
        }
        run('INSERT INTO conversations (type, teamId, name) VALUES (?, ?, ?)', ['team', teamId, teamName || 'Ekip Sohbeti']);
        conv = get('SELECT last_insert_rowid() as id');
        const convId = conv.id;
        run('INSERT OR IGNORE INTO conversation_members (conversationId, userId) VALUES (?, ?)', [convId, req.user.id]);
        if (memberEmails && Array.isArray(memberEmails)) {
            memberEmails.forEach(email => {
                const u = get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
                if (u) run('INSERT OR IGNORE INTO conversation_members (conversationId, userId) VALUES (?, ?)', [convId, u.id]);
            });
        }
        saveDB();
        res.json({ conversationId: convId, existing: false });
    } catch (err) { console.error('[Conv]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

/* ========== MESSAGE ROUTES ========== */
app.get('/api/messages/:conversationId', auth, (req, res) => {
    try {
        const convId = parseInt(req.params.conversationId);
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const messages = all('SELECT m.*, u.firstName, u.lastName, u.email as senderEmail, u.avatar as senderAvatar FROM messages m JOIN users u ON u.id = m.senderId WHERE m.conversationId = ? ORDER BY m.createdAt ASC LIMIT ? OFFSET ?', [convId, limit, offset]);
        // Enrich with reply data and detect soft-deleted messages
        messages.forEach(msg => {
            if (msg.replyToId) {
                const replyMsg = get('SELECT m.id, m.text, m.senderId, u.firstName, u.lastName FROM messages m JOIN users u ON u.id = m.senderId WHERE m.id = ?', [msg.replyToId]);
                msg.replyTo = replyMsg || null;
            }
            // Mark soft-deleted messages and map edited flag
            if (!msg.text && !msg.imageBase64) {
                msg.deleted = true;
            }
            if (msg.edited === 1) {
                msg.edited = true;
            }
        });
        const total = get('SELECT COUNT(*) as count FROM messages WHERE conversationId = ?', [convId]);
        messages.forEach(msg => { if (msg.senderId !== req.user.id) run('INSERT OR IGNORE INTO message_reads (messageId, userId) VALUES (?, ?)', [msg.id, req.user.id]); });
        saveDB();
        res.json({ messages, total: total ? total.count : 0 });
    } catch (err) { console.error('[Msg]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

/* ========== DELETE CONVERSATION ========== */
app.delete('/api/conversations/:id', auth, (req, res) => {
    try {
        const convId = parseInt(req.params.id);
        // Verify user is a member of this conversation
        const member = get('SELECT 1 FROM conversation_members WHERE conversationId = ? AND userId = ?', [convId, req.user.id]);
        if (!member) return res.status(403).json({ error: 'Bu sohbete erişiminiz yok' });
        // Delete all related data
        const msgIds = all('SELECT id FROM messages WHERE conversationId = ?', [convId]);
        msgIds.forEach(m => run('DELETE FROM message_reads WHERE messageId = ?', [m.id]));
        run('DELETE FROM messages WHERE conversationId = ?', [convId]);
        run('DELETE FROM conversation_members WHERE conversationId = ?', [convId]);
        run('DELETE FROM conversations WHERE id = ?', [convId]);
        saveDB();
        res.json({ success: true });
    } catch (err) { console.error('[Conv Delete]', err); res.status(500).json({ error: 'Sunucu hatası' }); }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

/* ========== SOCKET.IO ========== */
const io = new Server(server, { cors: { origin: '*' }, maxHttpBufferSize: 10e6 });
const onlineUsers = new Map();

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token gerekli'));
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Geçersiz token'));
        socket.userId = decoded.id;
        socket.userEmail = decoded.email;
        next();
    });
});

io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[WS] User ${userId} connected`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    run('UPDATE users SET lastSeen = datetime("now") WHERE id = ?', [userId]);

    const convs = all('SELECT conversationId FROM conversation_members WHERE userId = ?', [userId]);
    convs.forEach(c => socket.join('conv_' + c.conversationId));

    io.emit('user_online', { userId });
    socket.emit('online_users', { userIds: Array.from(onlineUsers.keys()) });

    socket.on('send_message', (data, cb) => {
        try {
            const { conversationId, text, imageBase64, replyToId } = data;
            if (!conversationId || (!text && !imageBase64)) return cb && cb({ error: 'Mesaj boş' });
            run('INSERT INTO messages (conversationId, senderId, text, imageBase64, replyToId) VALUES (?, ?, ?, ?, ?)',
                [conversationId, userId, text || null, imageBase64 || null, replyToId || null]);
            const msg = get('SELECT last_insert_rowid() as id');
            const user = get('SELECT firstName, lastName, email, avatar FROM users WHERE id = ?', [userId]);
            saveDB();
            const message = {
                id: msg.id, conversationId, senderId: userId, text, imageBase64: imageBase64 || null,
                replyToId: replyToId || null, createdAt: new Date().toISOString(),
                firstName: user.firstName, lastName: user.lastName, senderEmail: user.email, senderAvatar: user.avatar
            };
            io.to('conv_' + conversationId).emit('new_message', message);
            const members = all('SELECT userId FROM conversation_members WHERE conversationId = ? AND userId != ?', [conversationId, userId]);
            members.forEach(m => {
                const socks = onlineUsers.get(m.userId);
                if (socks) socks.forEach(sid => io.to(sid).emit('message_notification', { conversationId, message, senderName: user.firstName + ' ' + user.lastName }));
            });
            if (cb) cb({ success: true, message });
        } catch (err) { console.error('[WS] send_message:', err); if (cb) cb({ error: 'Gönderilemedi' }); }
    });

    socket.on('delete_message', (data) => {
        try {
            run('UPDATE messages SET text = NULL, imageBase64 = NULL WHERE id = ? AND senderId = ?', [data.messageId, userId]);
            saveDB();
            io.to('conv_' + data.conversationId).emit('message_deleted', data);
        } catch (e) { console.error('[WS] delete:', e); }
    });

    socket.on('edit_message', (data, cb) => {
        try {
            const { messageId, conversationId, text } = data;
            if (!messageId || !text) return cb && cb({ error: 'Geçersiz istek' });
            const msg = get('SELECT * FROM messages WHERE id = ? AND senderId = ?', [messageId, userId]);
            if (!msg) return cb && cb({ error: 'Mesaj bulunamadı' });
            const created = new Date(msg.createdAt + 'Z');
            const now = new Date();
            const diffMs = now - created;
            if (diffMs > 3 * 60 * 60 * 1000) return cb && cb({ error: 'Düzenleme süresi doldu (3 saat)' });
            run('UPDATE messages SET text = ?, edited = 1 WHERE id = ? AND senderId = ?', [text, messageId, userId]);
            saveDB();
            io.to('conv_' + conversationId).emit('message_edited', { messageId, conversationId, text, editedBy: userId });
            if (cb) cb({ success: true });
        } catch (e) { console.error('[WS] edit:', e); if (cb) cb({ error: 'Düzenlenemedi' }); }
    });

    socket.on('react_message', (data) => {
        try {
            const { messageId, conversationId, emoji, previousEmoji } = data;
            if (!messageId || !emoji) return;
            const user = get('SELECT firstName, lastName FROM users WHERE id = ?', [userId]);
            io.to('conv_' + conversationId).emit('message_reaction', { messageId, conversationId, emoji, previousEmoji: previousEmoji || null, userId, userName: user ? user.firstName + ' ' + user.lastName : '' });
        } catch (e) { console.error('[WS] react:', e); }
    });

    socket.on('typing_start', (d) => {
        const u = get('SELECT firstName, lastName FROM users WHERE id = ?', [userId]);
        socket.to('conv_' + d.conversationId).emit('user_typing', { conversationId: d.conversationId, userId, userName: u ? u.firstName + ' ' + u.lastName : '' });
    });
    socket.on('typing_stop', (d) => socket.to('conv_' + d.conversationId).emit('user_stopped_typing', { conversationId: d.conversationId, userId }));

    socket.on('mark_read', (d) => {
        try {
            const msgs = all('SELECT id FROM messages WHERE conversationId = ? AND senderId != ?', [d.conversationId, userId]);
            msgs.forEach(m => run('INSERT OR IGNORE INTO message_reads (messageId, userId) VALUES (?, ?)', [m.id, userId]));
            saveDB();
            socket.to('conv_' + d.conversationId).emit('messages_read', { conversationId: d.conversationId, userId });
        } catch (e) { console.error('[WS] mark_read:', e); }
    });

    socket.on('join_conversation', (d) => socket.join('conv_' + d.conversationId));

    socket.on('disconnect', () => {
        const s = onlineUsers.get(userId);
        if (s) { s.delete(socket.id); if (s.size === 0) { onlineUsers.delete(userId); run('UPDATE users SET lastSeen = datetime("now") WHERE id = ?', [userId]); saveDB(); io.emit('user_offline', { userId }); } }
    });
});

/* ========== START ========== */
initDB().then(() => {
    server.listen(PORT, () => {
        console.log(`\n🚀 NoteDay Unified Server — port ${PORT}`);
        console.log(`   Site:   http://localhost:${PORT}`);
        console.log(`   Chat:   http://localhost:${PORT} (Socket.io)`);
        console.log(`   Health: http://localhost:${PORT}/api/health\n`);
    });
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });

process.on('SIGINT', () => { console.log('\n[Server] Shutting down...'); saveDB(); process.exit(0); });
process.on('SIGTERM', () => { saveDB(); process.exit(0); });
