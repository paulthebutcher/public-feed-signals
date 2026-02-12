import { searchAskHNPosts, type HNPost } from './hackernews';
import { searchDevToPosts, type DevToPost } from './devto';
import { searchIndieHackersPosts, type IndieHackersPost } from './indiehackers';
import { searchGitHubIssues, type GitHubIssue } from './github';
import { searchStackOverflow, type SOQuestion } from './stackoverflow';
import { searchProductHunt, type ProductHuntPost } from './producthunt';
import { searchYCRFS, type YCRFSPost } from './yc-rfs';
import { searchFailory, type FailoryPost } from './failory';
import { searchQuora, type QuoraPost } from './quora';
import { searchMedium, type MediumPost } from './medium';
import type { Post } from './types';

/**
 * Convert HN post to unified Post format
 */
function hnToPost(post: HNPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'hackernews',
  };
}

/**
 * Convert Dev.to post to unified Post format
 */
function devtoToPost(post: DevToPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'devto',
  };
}

/**
 * Convert Indie Hackers post to unified Post format
 */
function ihToPost(post: IndieHackersPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'indiehackers',
  };
}

/**
 * Convert GitHub issue to unified Post format
 */
function githubToPost(issue: GitHubIssue): Post {
  return {
    id: issue.id,
    title: issue.title,
    content: issue.content,
    url: issue.url,
    score: issue.score,
    comments: issue.comments,
    author: issue.author,
    published: issue.published,
    age_hours: issue.age_hours,
    source: 'github',
  };
}

/**
 * Convert Stack Overflow question to unified Post format
 */
function soToPost(question: SOQuestion): Post {
  return {
    id: question.id,
    title: question.title,
    content: question.content,
    url: question.url,
    score: question.score,
    comments: question.comments,
    author: question.author,
    published: question.published,
    age_hours: question.age_hours,
    source: 'stackoverflow',
  };
}

/**
 * Convert Product Hunt post to unified Post format
 */
function phToPost(post: ProductHuntPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'producthunt',
  };
}

/**
 * Convert YC RFS post to unified Post format
 */
function ycrfsToPost(post: YCRFSPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'yc-rfs',
  };
}

/**
 * Convert Failory post to unified Post format
 */
function failoryToPost(post: FailoryPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'failory',
  };
}

/**
 * Convert Quora post to unified Post format
 */
function quoraToPost(post: QuoraPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'quora',
  };
}

/**
 * Convert Medium post to unified Post format
 */
function mediumToPost(post: MediumPost): Post {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    url: post.url,
    score: post.score,
    comments: post.comments,
    author: post.author,
    published: post.published,
    age_hours: post.age_hours,
    source: 'medium',
  };
}

export type DataSource = 'hackernews' | 'devto' | 'indiehackers' | 'github' | 'stackoverflow' | 'producthunt' | 'yc-rfs' | 'failory' | 'medium' | 'all';

/**
 * Search across multiple data sources
 */
export async function searchMultipleSources(
  keywords: string,
  sources: DataSource[] = ['all'],
  limit: number = 20
): Promise<Post[]> {
  const enabledSources = sources.includes('all')
    ? ['hackernews', 'devto', 'indiehackers', 'github', 'stackoverflow', 'producthunt', 'yc-rfs', 'failory', 'medium']
    : sources;

  // Fetch 3x requested limit per source, then filter down for better results
  const postsPerSource = Math.ceil((limit * 3) / enabledSources.length);

  // Fetch from all enabled sources in parallel
  const promises: Promise<Post[]>[] = [];

  if (enabledSources.includes('hackernews')) {
    promises.push(
      searchAskHNPosts(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] HackerNews: ${posts.length} posts`);
          return posts.map(hnToPost);
        })
        .catch((err) => {
          console.error(`[Sources] HackerNews failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('devto')) {
    promises.push(
      searchDevToPosts(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] Dev.to: ${posts.length} posts`);
          return posts.map(devtoToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Dev.to failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('indiehackers')) {
    promises.push(
      searchIndieHackersPosts(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] Indie Hackers: ${posts.length} posts`);
          return posts.map(ihToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Indie Hackers failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('github')) {
    promises.push(
      searchGitHubIssues(keywords, postsPerSource)
        .then((issues) => {
          console.log(`[Sources] GitHub: ${issues.length} issues`);
          return issues.map(githubToPost);
        })
        .catch((err) => {
          console.error(`[Sources] GitHub failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('stackoverflow')) {
    promises.push(
      searchStackOverflow(keywords, postsPerSource)
        .then((questions) => {
          console.log(`[Sources] Stack Overflow: ${questions.length} questions`);
          return questions.map(soToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Stack Overflow failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('producthunt')) {
    promises.push(
      searchProductHunt(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] Product Hunt: ${posts.length} posts`);
          return posts.map(phToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Product Hunt failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('yc-rfs')) {
    promises.push(
      searchYCRFS(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] YC RFS: ${posts.length} posts`);
          return posts.map(ycrfsToPost);
        })
        .catch((err) => {
          console.error(`[Sources] YC RFS failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('failory')) {
    promises.push(
      searchFailory(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] Failory: ${posts.length} posts`);
          return posts.map(failoryToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Failory failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('quora')) {
    promises.push(
      searchQuora(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] Quora: ${posts.length} questions`);
          return posts.map(quoraToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Quora failed:`, err.message);
          return [];
        })
    );
  }

  if (enabledSources.includes('medium')) {
    promises.push(
      searchMedium(keywords, postsPerSource)
        .then((posts) => {
          console.log(`[Sources] Medium: ${posts.length} articles`);
          return posts.map(mediumToPost);
        })
        .catch((err) => {
          console.error(`[Sources] Medium failed:`, err.message);
          return [];
        })
    );
  }

  const results = await Promise.all(promises);

  // Combine and deduplicate
  const allPosts = results.flat();

  console.log(`[Sources] Total combined: ${allPosts.length} posts from ${enabledSources.length} sources`);
  console.log(`[Sources] By source: ${enabledSources.map(s => {
    const count = allPosts.filter(p => p.source === s).length;
    return `${s}=${count}`;
  }).join(', ')}`);

  // Sort by score (quality signal) and recency
  const sortedPosts = allPosts.sort((a, b) => {
    // Primary: score
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;

    // Secondary: recency
    return a.age_hours - b.age_hours;
  });

  return sortedPosts.slice(0, limit);
}
