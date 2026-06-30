export default async function handler(req, res) {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return res.status(500).json({ error: 'Redis not configured' });

    const response = await fetch(`${url}/lrange/nutribox_submissions/0/100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const items = data.result || [];
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}