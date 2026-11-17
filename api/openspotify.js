// GET /openspotify/:id redirects to the song you are listening to on Spotify.
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '').replace(/\D/g, '');
  let url = 'https://open.spotify.com';
  try {
    const j = await (await fetch('https://api.lanyard.rest/v1/users/' + id)).json();
    const sp = j && j.data && j.data.listening_to_spotify && j.data.spotify;
    if (sp && sp.track_id) url = 'https://open.spotify.com/track/' + sp.track_id;
  } catch (e) {}
  res.statusCode = 302; res.setHeader('Location', url); res.setHeader('Cache-Control', 'no-store'); res.end();
};
