import { Ratelimit } from '@upstash/ratelimit';
import redis from './redis';

const ratelimit = new Ratelimit({
	redis,
	limiter: Ratelimit.slidingWindow(3, '60 s') // 3 actions only in each 60 seconds
});

export default ratelimit;
