import fs from 'fs';
import readline from 'readline';

async function run() {
  const filePath = 'C:/Users/RAKESH/.gemini/antigravity-ide/brain/678c63da-fdc5-426b-a515-8c2239254c1f/.system_generated/logs/transcript.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      // Scan content for interesting words
      const text = JSON.stringify(data.content || '') + JSON.stringify(data.tool_calls || '') + JSON.stringify(data.thinking || '');
      
      const keywords = ['anon', 'key', 'eyJ', 'password', '1301200'];
      for (const kw of keywords) {
        if (text.toLowerCase().includes(kw.toLowerCase())) {
          // If it's a USER_INPUT, print the content
          if (data.type === 'USER_INPUT') {
            console.log(`[USER_INPUT Step ${data.step_index}] Match for '${kw}':`);
            console.log(data.content.substring(0, 1000));
            console.log('---');
          } else if (data.type === 'PLANNER_RESPONSE') {
            console.log(`[PLANNER_RESPONSE Step ${data.step_index}] Match for '${kw}'`);
          }
          break;
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

run();
