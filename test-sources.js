// Quick test to see what's actually being returned from each source

const BASE_URL = 'http://localhost:3000';

async function testDevTo() {
  console.log('\n=== Testing Dev.to API directly ===');
  const tags = ['discuss', 'help', 'watercooler', 'askdev', 'devjournal'];
  
  for (const tag of tags) {
    const url = `https://dev.to/api/articles?tag=${tag}&per_page=10`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ProblemSignalMiner/1.0' }
    });
    const articles = await response.json();
    
    console.log(`\n${tag}: ${articles.length} articles`);
    if (articles.length > 0) {
      const recent = articles.filter(a => {
        const age = (Date.now() - new Date(a.published_at).getTime()) / (1000 * 60 * 60);
        return age < 168; // 7 days
      });
      console.log(`  - ${recent.length} from last 7 days`);
      
      const withStartup = recent.filter(a => 
        (a.title + ' ' + (a.description || '')).toLowerCase().includes('startup')
      );
      console.log(`  - ${withStartup.length} mention "startup"`);
      
      if (withStartup.length > 0) {
        console.log('    Example:', withStartup[0].title);
      }
    }
  }
}

async function testIndieHackers() {
  console.log('\n=== Testing Indie Hackers RSS ===');
  const response = await fetch('https://feed.indiehackers.world/posts.rss', {
    headers: { 'User-Agent': 'ProblemSignalMiner/1.0' }
  });
  const xmlText = await response.text();
  
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let count = 0;
  let recentCount = 0;
  let startupCount = 0;
  
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    count++;
    const itemContent = match[1];
    const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
    
    if (pubDate) {
      const age = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
      if (age < 168) {
        recentCount++;
        if (itemContent.toLowerCase().includes('startup')) {
          startupCount++;
          const title = (itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                        itemContent.match(/<title>(.*?)<\/title>/))?.[1];
          if (startupCount === 1) console.log('  Example:', title);
        }
      }
    }
  }
  
  console.log(`Total posts: ${count}`);
  console.log(`From last 7 days: ${recentCount}`);
  console.log(`Mention "startup": ${startupCount}`);
}

async function testHackerNews() {
  console.log('\n=== Testing HackerNews API ===');
  
  // Get Ask HN posts
  const response = await fetch('https://hacker-news.firebaseio.com/v0/askstories.json');
  const askIds = await response.json();
  
  console.log(`Total Ask HN stories: ${askIds.length}`);
  
  // Sample first 100
  const sample = askIds.slice(0, 100);
  let recentCount = 0;
  let startupCount = 0;
  
  for (const id of sample) {
    const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    const item = await itemResponse.json();
    
    if (!item || !item.title) continue;
    
    const age = (Date.now() - item.time * 1000) / (1000 * 60 * 60);
    if (age < 168) {
      recentCount++;
      if (item.title.toLowerCase().includes('startup')) {
        startupCount++;
        if (startupCount === 1) console.log('  Example:', item.title);
      }
    }
  }
  
  console.log(`From last 7 days (sample of 100): ${recentCount}`);
  console.log(`Mention "startup": ${startupCount}`);
}

(async () => {
  try {
    await testDevTo();
    await testIndieHackers();
    await testHackerNews();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
