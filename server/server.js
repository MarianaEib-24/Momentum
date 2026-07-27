import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
const port = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'momentum_dev_secret';
const dbFile = join(process.cwd(), 'server', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

await db.read();
if (!db.data) {
    db.data = { users: [], sessions: [], workspaces: [] };
    await db.write();
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

function createToken(user) {
    return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = auth.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

app.get('/api/auth/users', async (req, res) => {
    await db.read();
    res.json({ users: db.data.users.map(({ password, ...rest }) => rest) });
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    await db.read();
    const exists = db.data.users.find((u) => u.email === email);
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const hashed = bcrypt.hashSync(password, 10);
    const user = { id: nanoid(8), name, email, password: hashed, role: 'Member', grad: ['#2f6bff', '#7c5cff'], focus: '' };
    db.data.users.push(user);
    db.data.workspaces.push({ userId: user.id, payload: null });
    await db.write();
    const token = createToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, grad: user.grad, focus: user.focus }, data: null });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    await db.read();
    const user = db.data.users.find((u) => u.email === email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    const workspace = db.data.workspaces.find((w) => w.userId === user.id);
    const token = createToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, grad: user.grad, focus: user.focus }, data: workspace?.payload ?? null });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...rest } = user;
    res.json({ user: rest });
});

app.get('/api/data', authMiddleware, async (req, res) => {
    await db.read();
    const workspace = db.data.workspaces.find((w) => w.userId === req.user.sub);
    res.json({ data: workspace?.payload || null });
});

app.post('/api/data', authMiddleware, async (req, res) => {
    await db.read();
    const workspace = db.data.workspaces.find((w) => w.userId === req.user.sub);
    if (workspace) {
        workspace.payload = req.body;
    } else {
        db.data.workspaces.push({ userId: req.user.sub, payload: req.body });
    }
    await db.write();
    res.json({ ok: true });
});

app.post('/api/data/import', authMiddleware, async (req, res) => {
    await db.read();
    const workspace = db.data.workspaces.find((w) => w.userId === req.user.sub);
    if (workspace) {
        workspace.payload = req.body;
    } else {
        db.data.workspaces.push({ userId: req.user.sub, payload: req.body });
    }
    await db.write();
    res.json({ ok: true });
});

app.post('/api/data/reset', authMiddleware, async (req, res) => {
    await db.read();
    const workspace = db.data.workspaces.find((w) => w.userId === req.user.sub);
    if (workspace) {
        workspace.payload = null;
    }
    await db.write();
    res.json({ ok: true });
});

app.use(express.static(join(process.cwd(), 'dist')));
app.get('*', (req, res) => {
    res.sendFile(join(process.cwd(), 'dist', 'index.html'));
});

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Momentum server listening on http://localhost:${port}`);
});
