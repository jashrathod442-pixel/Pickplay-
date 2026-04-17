require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'pickplay-secret-2026';

// Connect to Supabase database
const supabase = createClient(
  process.env.SUPABASE_URL,
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY?.replace(/
/g, '');
);

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Auth check middleware ──
function authUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

// ── TEST: check if server is running ──
app.get('/health', (req, res) => {
  res.json({ status: 'PickPlay server is running!', time: new Date() });
});

// ═══════════════════════
// USER REGISTRATION
// ═══════════════════════
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, skill, avCol, avFg } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'This email is already registered' });
    }

    // Encrypt password (never store plain text passwords)
    const password_hash = await bcrypt.hash(password, 10);

    // Save user to database
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password_hash, phone, city, skill,
                av_col: avCol || '#00e5a0', av_fg: avFg || '#06111f' })
      .select()
      .single();

    if (error) throw error;

    // Create login token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// USER LOGIN
// ═══════════════════════
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
      return res.status(401).json({ error: 'Email not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// GET ALL COURTS
// ═══════════════════════
app.get('/courts', async (req, res) => {
  try {
    let query = supabase.from('courts').select('*').eq('active', true);

    if (req.query.city) query = query.eq('city', req.query.city);
    if (req.query.sport) query = query.contains('sport', [req.query.sport]);
    if (req.query.search) query = query.ilike('name', `%${req.query.search}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// GET AVAILABLE SLOTS
// ═══════════════════════
app.get('/courts/:id/slots', async (req, res) => {
  try {
    const { data: booked } = await supabase
      .from('slot_locks')
      .select('time_slot')
      .eq('court_id', req.params.id)
      .eq('date', req.query.date);

    const allSlots = [
      '6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM',
      '12:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM'
    ];

    const bookedTimes = (booked || []).map(s => s.time_slot);
    res.json(allSlots.map(t => ({ time: t, available: !bookedTimes.includes(t) })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// REGISTER A NEW VENUE
// ═══════════════════════
app.post('/courts/register', authUser, async (req, res) => {
  try {
    const { name, city, area, address, sport, type, numCourts, price, amenities } = req.body;
    const { data, error } = await supabase
      .from('courts')
      .insert({
        name, city, area, address, sport: sport || ['Pickleball'],
        type, num_courts: numCourts || 1, price: price || 300,
        amenities: amenities || [], owner_id: req.user.id,
        active: false, pending: true
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// BOOK A SLOT
// ═══════════════════════
app.post('/bookings', authUser, async (req, res) => {
  try {
    const { courtId, courtName, city, sport, date, timeSlot, price, paymentMethod } = req.body;

    // Lock the slot so nobody else can book same time
    const { error: lockError } = await supabase
      .from('slot_locks')
      .insert({ court_id: courtId, date, time_slot: timeSlot, booked_by: req.user.id });

    if (lockError) {
      return res.status(409).json({ error: 'This slot was just booked by someone else!' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user.id, court_id: courtId,
        court_name: courtName, city, sport, date,
        time_slot: timeSlot, price, payment_method: paymentMethod
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// GET MY BOOKINGS
// ═══════════════════════
app.get('/bookings/my', authUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// GET ALL TOURNAMENTS
// ═══════════════════════
app.get('/tournaments', async (req, res) => {
  try {
    let query = supabase.from('tournaments').select('*');
    if (req.query.city) query = query.eq('city', req.query.city);
    if (req.query.sport) query = query.eq('sport', req.query.sport);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// CREATE A TOURNAMENT
// ═══════════════════════
app.post('/tournaments', authUser, async (req, res) => {
  try {
    const { name, city, venue, sport, format, level,
            dateStr, maxSlots, fee, prize, description, contact } = req.body;

    const { data: userRow } = await supabase
      .from('users').select('name').eq('id', req.user.id).single();

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name, city, venue, sport, format, level,
        date_str: dateStr, max_slots: maxSlots || 32,
        slots_left: maxSlots || 32, fee: fee || 0, prize,
        description, contact, organizer: userRow?.name,
        organizer_id: req.user.id
      })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// JOIN A TOURNAMENT
// ═══════════════════════
app.post('/tournaments/:id/register', authUser, async (req, res) => {
  try {
    const { skill, partner } = req.body;
    const { error } = await supabase
      .from('tournament_registrations')
      .insert({ tournament_id: req.params.id, user_id: req.user.id, skill, partner });
    if (error) return res.status(409).json({ error: 'Already registered' });
    await supabase.rpc('decrement_slots', { tournament_id: req.params.id });
    res.json({ message: 'Successfully registered!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// OWNER DASHBOARD DATA
// ═══════════════════════
app.get('/owner/dashboard', authUser, async (req, res) => {
  try {
    const { data: court } = await supabase
      .from('courts').select('*').eq('owner_id', req.user.id).single();
    if (!court) return res.status(404).json({ error: 'No court found for this owner' });

    const today = new Date().toISOString().split('T')[0];
    const { data: todayBks } = await supabase
      .from('bookings').select('*')
      .eq('court_id', court.id).eq('date', today);
    const { data: allBks } = await supabase
      .from('bookings').select('id').eq('court_id', court.id);

    res.json({
      court,
      stats: {
        todayRevenue: (todayBks?.length || 0) * court.price,
        monthRevenue: (allBks?.length || 0) * court.price,
        todayBookings: todayBks?.length || 0,
        totalBookings: allBks?.length || 0,
      },
      recentBookings: todayBks || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════
// GET ALL PLAYERS
// ═══════════════════════
app.get('/players', async (req, res) => {
  try {
    let query = supabase.from('users').select('id, name, city, skill, av_col, av_fg, games, wins').eq('role', 'user');
    if (req.query.city) query = query.eq('city', req.query.city);
    if (req.query.skill) query = query.eq('skill', req.query.skill);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ PickPlay server running on http://localhost:${PORT}`);
  console.log(`✅ Connected to Supabase database`);
});
