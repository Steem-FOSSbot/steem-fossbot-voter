# Algorithm and metrics

The factors influencing whether or not a post is choosen to be voted on _must be measureable_, and not abstract, as they may exist in our own personal reasoning. These measurements are called **metrics**.

A metric is a transformation of the facts (i.e. data) of the Steem posts and environment, such as word count, number of votes already cast, whether the author is followed, etc. into a value which can be used independently of the data, and exists in form which renders disparate data usable by the same set of operations. We transform any data into numeric values for simplicity of score calculation.

The **algorithm** is a customizable process which each user can tweak to make their own bot curate as they would like it to curation. It is intended to be an approximate model of how you usually vote.

Most strategic metrics are simply readable from the API, but cultural metrics are harder to quantify, necessarily requiring the use of Natural Language Processing (NLP).

### Metrics

Some metrics use data directly where it is already numeric, such as the number of words in a post, the number of votes, etc.

Since each metric must be numeric, we will give boolean assign boolean values ```0``` if false and ```1``` if true. Boolean metrics come from questions like "Does the user follow the author of this post?"

The actual metrics used are detailed at the end of this document.

### Algorithm

The algorithm combines metrics into a single score using metric values at a certain weight (i.e. multiplication factor) and optionally _within_ a certain range.

The weights scale metric values in order to change the contributing effect of a metric. They can also be used to make a  value more (or even less!) reasonable.

Bounding a metric value _within_ a range can also makes the value more reasonable. You may want to cap the word count having an effect on a increasing the overall score at 2000 words for example.

#### Polynomial

If we set the conditions aside, the algorithm is simply a [polynomial](https://en.wikipedia.org/wiki/Polynomial). For example:

Let ```M``` be the set of metrics such that ```m[1]``` is the first metric, ```m[2]``` is the second, etc. until ```m[n-1]``` is the second last and ```m[n]``` is the last, where ```n``` is the number of metrics.

If range is to be applied, let ```l``` be the lower bound value and ```u``` be the upper value. Then apply the following:

```
for each m at index i
	if m[i] < l then m[i] = l
	if m[i] > u then m[i] = u
```

Let ```W``` be the set of weights applied to each metric, also of size ```n```.

Then, the algorithm which produces a score ```s``` would be

```s = w[1]*m[1] + w[2]*m[2] + ... + w[n-1]*m[n-1] + w[n]*m[n]```

#### Conditions as value

For our boolean values, you can think of their usage in the polynomial as adding a certain value if the condition is true. The value will be the weight directly, since if it is false we will have

```w[i]*m[i] = w[i]*0 = 0```

but if true we will have

```w[i]*m[i] = w[i]*1 = w[i]```

We could potentially use this completely drop or maximise the score, by using either a maximally negative or positive weight respectively. For example, we may want to always vote for a post by a certain author. In that case we would set the weight for metric ```matrics.author.whitelisted``` to a very large value, such as ```2^32```. Conversely, if we wanted to never vote for a post with a certiain word as keyword, we would set the weight for the metric ```metrics.post.num_keywords_blacklisted``` to a very large _negative_ value, such as ```-2^32```. However it doesn't have to be that extreme.

##### Possible feature additions

1. Add non-linear scaling option for metric values.
2. Add other kind of range which excludes (i.e. zeros) value if value falls outside range

## Metrics

All metrics show the key name first, then a short description

Metric key in object access format, and roughly maps to an internal JavaScript object, but should be considered an arbitrary String key

**Note**: capital category (minnow, dolphin, whale) is defined as

- _Minnow_ has capital < 25,000 Steem Power
- _Dolphin_ has capital >= 25,000 and < 100,000 Steem Power
- _Whale_ has as capital >= 100,000 Steem Power

### Strategic metrics

_Note: All data current at time of sample_

#### Bot Owner (user running the bot)
1. ```metrics.owner.num_votes_today```: Number of votes today
2. ```metrics.owner.last_post_time```: Time since last post in minutes

#### Post

1. ```metrics.post.alive_time```: Time since post, in minutes
2. ```metrics.post.est_payout```: Estimated payout
3. ```metrics.post.num_votes```: Number of votes

**Can't access from API**

~~metrics.post.num_downvotes: Number of flags / downvotes~~

#### Post - votes in detail

_Note: we'll skip the minnows when testing votes!_

##### Numeric

1. ```metrics.post.voted_num_dolphin```: Number of voters with captial category _dolphin_ who voted on post
2. ```metrics.post.voted_num_whale```: Number of voters with captial category _whale_ who voted on post
3. ```matrics.post.voted_num_followed```: Number of followed voters who voted on post
4. ```matrics.post.voted_num_whitelisted```: Number of whitelisted voters who voted on post
5. ```matrics.post.voted_num_blacklisted```: Number of blacklisted voters who voted on post

##### Boolean

1. ```metrics.post.voted_any_dolphin```: At least one voter with captial category _dolphin_ as voted on post (false = 0, true = 1)
2. ```metrics.post.voted_any_whale```: At least one voter with captial category _whale_ as voted on post (false = 0, true = 1)
3. ```matrics.post.voted_any_followed```: At least one followed voter voted on post (false = 0, true = 1)
4. ```matrics.post.voted_any_whitelisted```: At least one whitelist voter voted on post (false = 0, true = 1)
5. ```matrics.post.voted_any_blacklisted```: At least one blacklist voter voted on post (false = 0, true = 1)

#### Author of Post

##### Numeric

1. ```metrics.author.num_posts_today```: Number of posts today
2. ```metrics.author.last_post_time```: Time since last post in minutes
3. ```metrics.author.capital_val```: Capital (Steem Power) by value 
4. ```metrics.author.last_post_payout```: Last post payout
5. ```metrics.author.all_post_payout_avg```: Average post payout for all posts by author
6. ```metrics.author.total_post_payout_median```: Average post payout for all posts by author

##### Boolean

Note, author capital category (minnow, dolphin, whale) is defined as

- _Minnow_ has capital < 25,000 Steem Power
- _Dolphin_ has capital >= 25,000 and < 100,000 Steem Power
- _Whale_ has as capital >= 100,000 Steem Power

1. ```metrics.author.is_minnow```: Capital category is _minnow_ (false = 0, true = 1)
2. ```metrics.author.is_dolphin```: Capital category is _dolphin_ (false = 0, true = 1)
3. ```metrics.author.is_whale```: Capital category is _whale_ (false = 0, true = 1)
4. ```matrics.author.is_followed```: Author is followed (false = 0, true = 1)
5. ```matrics.author.is_whitelisted```: Presence of author on whitelist (false = 0, true = 1)
6. ```matrics.author.is_blacklisted```: Presence of author on blacklist (false = 0, true = 1)

### Cultural metrics

A whitelist and blacklist is supplied for the following:

- Content words
- Authors
- Domains

The way these are used depends on the metric. They can be empty and will then have no effect.

#### Content - Text

Using NLP, we can parse the text content and get the topic, keywords and _sentiment_, a single value score of positivity / negativity, sometimes also called an emotional score.

##### Numeric

1. ```metrics.post.num_chars```: Post length in characters
2. ```metrics.post.num_words```: Post length in words
3. ```metrics.post.sentiment__val```: Sentiment / emotional score
5. ```metrics.post.num_keywords_whitelisted```: Number of unique whitelisted words
6. ```metrics.post.num_keywords_blacklisted```: Number of unique blacklisted words
7. ```metrics.post.num_words_whitelisted```: Number of unique whitelist words in entire content text
8. ```metrics.post.num_words_blacklisted```: Number of unique blacklist words in entire content text

##### Boolean

1. ```metrics.post.topic_whitelisted```: Topic on whitelist (false = 0, true = 1)
2. ```metrics.post.topic_blacklisted```: Topic on blacklist (false = 0, true = 1)
3. ```metrics.post.any_keyword_whitelisted```: Any keyword on whitelist (false = 0, true = 1)
4. ```metrics.post.any_keyword_blacklisted```: Any keyword on blacklist (false = 0, true = 1)

#### Content - Links

##### Numeric

1. ```metrics.post.num_links_video```: Number of video links
2. ```metrics.post.num_links_photo```: Number of photo links
3. ```metrics.post.num_links_page```: Number of webpage links
4. ```metrics.post.num_links_total```: Total number of links
5. ```metrics.post.num_link_domains_whitelisted```: Number of link domains on whitelist
6. ```metrics.post.num_link_domains_blacklisted```: Number of link domains on blacklist

##### Boolean

1. ```metrics.post.any_link_domains_whitelisted```: Any link domains on whitelist (false = 0, true = 1)
2. ```metrics.post.any_link_domains_blacklisted```: Any link domains on blacklist (false = 0, true = 1)

#### Author

##### Numeric

1. ```metrics.author.repuation```: Reputation (Stemit version, not direct from blockchain)