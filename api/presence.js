// GET /presence/:id returns the raw presence JSON (via Lanyard) so you can use it elsewhere.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const id = String((req.query && req.query.id) || '').replace(/\D/g, '');
  if (!id) return res.status(400).json({ success: false, error: 'missing id' });
  try {
    const r = await fetch('https://api.lanyard.rest/v1/users/' + id);
    const j = await r.json();
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=60');
    res.status(r.ok ? 200 : 404).json(j);
  } catch (e) { res.status(502).json({ success: false, error: 'upstream' }); }
};
