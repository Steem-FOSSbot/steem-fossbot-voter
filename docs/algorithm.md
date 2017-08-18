# Algorithm and metrics

The factors influencing whether or not a post is choosen to be voted on _must be measureable_, and not abstract, as they may exist in our own personal reasoning. These measurements are called **metrics**.

A metric is a transformation of the facts (i.e. data) of the Steem posts and environment, such as word count, number of votes already cast, whether the author is followed, etc. into a value which can be used independently of the data, and exists in form which renders disparate data usable by the same set of operations. We transform any data into numeric values for simplicity of score calculation.

The **algorithm** is a customizable process which each user can tweak to make their own bot curate as they would like it to curation. It is intended to be an approximate model of how you usually vote.

Most strategic metrics are simply readable from the API, but cultural metrics are harder to quantify, necessarily requiring the use of Natural Language Processing (NLP).

## Score calculation

### Metrics

Some metrics use data directly where it is already numeric, such as the number of words in a post, the number of votes, etc.

Since each metric must be numeric, we will give boolean assign boolean values ```0``` if false and ```1``` if true. Boolean metrics come from questions like "Does the user follow the author of this post?"

The actual metrics used are detailed at the end of this document.

### Algorithm

The algorithm combines metrics into a single score using metric values at a certain weight (i.e. multiplication factor) and optionally _within_ a certain range.

The weights scale metric values in order to change the contributing effect of a metric. They can also be used to make a  value more (or even less!) reasonable.

Bounding a metric value to a range can also makes the value more reasonable. You may want to cap the word count having an effect on a increasing the overall score at 2000 words for example.

#### Polynomial

If we set the conditions aside, the algorithm is simply a [polynomial](https://en.wikipedia.org/wiki/Polynomial). For example:

Let ```M``` be the set of metrics such that ```m[1]``` is the first metric, ```m[2]``` is the second, etc. until ```m[n-1]``` is the second last and ```m[n]``` is the last, where ```n``` is the number of metrics.

If range is to be applied, let ```l``` be the lower bound value and ```u``` be the upper value. Then apply the following:

```
for each m at index i
	if m[i] < l then m[i] = 0
	if m[i] >= l and m[i] < u then m[i] = m[i] - l
	if m[i] >= u then m[i] = u - l
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

## Threshold calculation

The threshold is automatically calculated so that you don't have to worry about pulling a good value out of the air.

The threshold is calculated in two steps:

1. Get average of post scores in the sliding window, i.e. up to the last ```NUM_POSTS_FOR_AVG_WINDOW``` number of posts
2. Increase this average by ```SCORE_THRESHOLD_INC_PC```
3. Increase this average approaching maximum threshold for vote as 
account voting power approaches ```MIN_VOTING_POWER```

#### 1. Calculate average score

The threshold uses a _sliding window_ to first calculate average post score, ending at the current post, and this is updated when scoring each post. So the window will consist of the last ```NUM_POSTS_FOR_AVG_WINDOW``` number of posts which scored equal to or above ```MIN_SCORE_THRESHOLD```. You can think of the ```MIN_SCORE_THRESHOLD``` as the minimum absolute post score. This should be positive and above zero to keep the threshold at least a little above zero. 

#### 2. Increase by percentage

By default, we add 10% of the _variance_ of the window to the average. This is specified in variable ```SCORE_THRESHOLD_INC_PC``` as a ratio, so 10% is stored as value ```0.1```.

This feature is intended to raise the average so that we don't end up just voting on average posts, literally, as defined by our own scoring algorithm.

Values of up to 0.6 or 60% can also work.

#### 3. Increase in as voting power decreases to minimum

In order to maintain voting power and spread votes over a longer period 
of time (not vote all in one go and then have no voting power left), we 
increase the threshold as voting power decreases after every vote, as 
voting power approaches ```MIN_VOTING_POWER```

Voting power will regenerate according to the blockchain algorithm (see 
[the discussion doc](/docs/discussion.md) for more information on the 
rate-limited voting of Steem).

```increase amount = (max score in window - (average + percentage_increase)) * (difference_in_voting_power_from_100% / (100 - MIN_VOTING_POWER))```

Note also that the effect is linear (as of change in issue #24). 

#### Summary of threshold calculation

In general, the threshold decreases if the scores have been low, and increases if the scores are high. If there are a few good posts in one hour, it will get progressively less likely they are all voted on, as the threshold will get raised for each good post scored and processed. Similarly, if a lot of posts score very low, the next good post is much more likely to be voted on.

Note that if the threshold is below ```MIN_SCORE_THRESHOLD```, it will be set to this value, i.e. it cannot be below this. As a result, you need to take care to make sure that your metrics weights are likely to result in a score which is above ```MIN_SCORE_THRESHOLD``` for the general case of a post you want to vote for.

The result (we have verified this works) is a steady flow of votes of relative quality to the most recent previous posts. Note that the window only includes posts which score above the minimum threshold, so really low scored posts are irrelevant to the threshold, i.e. there is some minimum standard of quality required.

This shows that the scoring system is relative and that, for example, a score of 40 does not mean anything except in relation to another score, say 20. 40 is twice as "suitable" as 20, but beyond that we don't need to know anything, nor do we need to. This needs to be kept in mind when designing your bot algorithm, when setting the weights, and tested against real data.

Be warned against changing the post window size to be too small or too large. Too small and, perhaps counter-intuitively, it will be much less likely for posts to be voted on because the lower scores are not keeping the average low. Too large a window means that the algorithm cannot respond to changes quickly and you risk the bot voting on a lot of low quality posts because the threshold could not raise quick enough, or missing a lot of good quality posts because a few very very good quality posts skewed the average too high for too long.

Finally, most of this assumes that you have a somewhat complex algorithm, i.e. that a few metrics are used which make the score result complex. However if only one metric is used, the system becomes simple and some of these assumptions do not hold. Please read the next subsection if you use a simple algorithm.

### Settings and constants
 
Most settings which effect the algorithm are editable. I have set sensible defaults, but these will not be appropriate for every situation.

The number in brackets is the default value:

#### Standard

Most people will want to edit these

1. **MIN_POST_AGE_TO_CONSIDER** (```21.22```): Number of minutes minimum 
to consider voting on a post. Any post younger than this time will be 
discarded for consideration at next run, if old enough then. For number 
explanation see [the discussion doc](/docs/discussion.md).
2. **TIME_ZONE_OFFSET** (```Etc/GMT+3```): Time zone for date display, in
 tz format ([see here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) for a list of formats). Used in UI, logging, etc.
3. **MIN_VOTING_POWER** (```50```): Do not vote if voting power left on 
account is less than this value
4. **VOTE_VOTING_POWER** (```100```): Vote power used when casting votes

#### Advanced

Edit with caution, setting these incorrectly can really break the bot

1. **MAX_POST_TO_READ** (```400```): Max number of posts fetched. Any more than this will be discarded
2. **MIN_WORDS_FOR_ARTICLE** (```100```): Minimum number of words for a post to be considered as having article content.
3. **NUM_POSTS_FOR_AVG_WINDOW** (```10```): Maximum number of posts used for averaging window used to determine baseline threshold score
4. **MIN_SCORE_THRESHOLD** (```10```): Minimum score value for thresholding. Anything below this will not be added to averaging and so will be discarded. Also no post with score less than this will be voted on.
5. **SCORE_THRESHOLD_INC_PC** (```0.1``` i.e. ```10%```): Ratio / percentage increase on average when calculating threshold. See Threshold Calculation above.
6. **CAPITAL_DOLPHIN_MIN** (```25000```): Minimum Steem Power to qualify as a _dolphin_
7. **CAPITAL_WHALE_MIN** (```100000```): Minimum Steem Power to qualify as a _whale_
8. **MIN_KEYWORD_LEN** (```4```): Minimum number of characters for a word to be considered a keyword
9. **DAYS_KEEP_LOGS** (```2```): Number of days for logs to expire at. These are kept in a 25 MB limit database currently if you're using a free Heroku set up so we keep this number low.
10. **MIN_LANGUAGE_USAGE_PC** (```0.3``` i.e. ```35%```): Minimum amount (expressed as a ratio, between 0.0 and 1.0) of document required to contain a language before it will be considered having a _signification amount_ of that language as content.
11. **MIN_KEYWORD_FREQ** (```3```): Minimum appearances of a word in a post for it to be considered a keyword

## Metrics in detail

##### Note in general

All metrics show the key name first, then a short description

Boolean type metrics are given numeric value 0 for false or 1 true when used in an algorithm.

##### Note on capital category

Capital category (minnow, dolphin, whale) is defined as

- _Minnow_ has capital < 25,000 Steem Power
- _Dolphin_ has capital >= 25,000 and < 100,000 Steem Power
- _Whale_ has as capital >= 100,000 Steem Power

This these settings are editable (see above)

##### Note on white / blacklists

A whitelist and blacklist is supplied for the following:

- Authors
- Category
- Content words
- Domains

The way these are used depends on the metric. They can be empty and will then have no effect.

### Strategic metrics

_Note: All data current at time of sample_

#### Bot Owner (user running the bot)
1. ```owner_num_votes_today```: Number of votes today
2. ```owner_last_post_time```: Time since last post in minutes

#### Post

1. ```post_alive_time```: Time since post, in minutes
2. ```post_est_payout```: Estimated payout
3. ```post_num_upvotes```: Number of up votes (normal votes _for_ a post)
4. ```post_num_downvotes```: Number of downvotes / flags

#### Post - votes in detail

_Note: we'll skip the minnows when testing votes!_

##### Numeric

1. ```post_up_voted_num_dolphin```: Number of voters with captial category _dolphin_ who **up** voted on post
2. ```post_up_voted_num_whale```: Number of voters with captial category _whale_ who **up** voted on post
3. ```post_up_voted_num_followed```: Number of followed voters who **up** voted on post
4. ```post_up_voted_num_whitelisted```: Number of whitelisted voters who **up** voted on post
5. ```post_up_voted_num_blacklisted```: Number of blacklisted voters who **up** voted on post
6. ```post_down_voted_num_dolphin```: Number of voters with captial category _dolphin_ who **down** voted on post
7. ```post_down_voted_num_whale```: Number of voters with captial category _whale_ who **down** voted on post
8. ```post_down_voted_num_followed```: Number of followed voters who **down** voted on post
9. ```post_down_voted_num_whitelisted```: Number of whitelisted voters who **down** voted on post
10. ```post_down_voted_num_blacklisted```: Number of blacklisted voters who **down** voted on post

##### Boolean

1. ```post_up_voted_any_dolphin```: At least one voter with captial category _dolphin_ **up** voted on post
2. ```post_up_voted_any_whale```: At least one voter with captial category _whale_ **up** voted on post
3. ```post_up_voted_any_followed```: At least one followed voter **up** voted on post
4. ```post_up_voted_any_whitelisted```: At least one whitelist voter **up** voted on post
5. ```post_up_voted_any_blacklisted```: At least one blacklist voter **up** voted on post
6. ```post_down_voted_any_dolphin```: At least one voter with captial category _dolphin_ **down** voted on post
7. ```post_down_voted_any_whale```: At least one voter with captial category _whale_ **down** voted on post
8. ```post_down_voted_any_followed```: At least one followed voter **down** voted on post
9. ```post_down_voted_any_whitelisted```: At least one whitelist voter **down** voted on post
10. ```post_down_voted_any_blacklisted```: At least one blacklist voter **down** voted on post

#### Author of Post

##### Numeric

1. ```author_capital_val```: Capital (Steem Power) by value 

**Proposed, not implemented**

1. ```author_last_post_payout```: Last post payout
2. ```author_all_post_payout_avg```: Average post payout for all posts by author
3. ```author_total_post_payout_median```: Average post payout for all posts by author

##### Boolean

1. ```author_is_minnow```: Capital category is _minnow_
2. ```author_is_dolphin```: Capital category is _dolphin_
3. ```author_is_whale```: Capital category is _whale_
4. ```author_is_followed```: Author is followed
5. ```author_is_whitelisted```: Presence of author on whitelist
6. ```author_is_blacklisted```: Presence of author on blacklist

### Cultural metrics

#### Content - Text

Using NLP, we can parse the text content and get the topic, keywords and _sentiment_, a single value score of positivity / negativity, sometimes also called an emotional score.

##### Numeric

1. ```post_num_chars```: Post length in characters
2. ```post_num_words```: Post length in words
3. ```post_sentiment_val```: Sentiment / emotional score
4. ```post_num_tags_whitelisted```: Number of whitelisted tags (uses content word lists)
5. ```post_num_tags_blacklisted```: Number of blacklisted tags (uses content word lists)
6. ```post_num_keywords_whitelisted```: Number of unique whitelisted keywords
7. ```post_num_keywords_blacklisted```: Number of unique blacklisted keywords
8. ```post_num_words_whitelisted```: Number of unique whitelist words in entire content text
9. ```post_num_words_blacklisted```: Number of unique blacklist words in entire content text

##### Boolean

1. ```post_category_whitelisted```: Category (sub-steem) on whitelist
2. ```post_category_blacklisted```: Category (sub-steem) on blacklist
3. ```post_any_tag_whitelisted```: Any tag on whitelist
4. ```post_any_tag_blacklisted```: Any tag on blacklist
3. ```post_any_keyword_whitelisted```: Any keyword on whitelist
4. ```post_any_keyword_blacklisted```: Any keyword on blacklist
5. ```post_has_english_language_use```: Significant amount of English language use
6. ```post_has_german_language_use```: Significant amount of German language use
7. ```post_has_spanish_language_use```: Significant amount of Spanish language use
8. ```post_has_french_language_use```: Significant amount of French language use

##### Proposed, not implemented, need to create topic trainer for natural js library

1. ```post_topic_whitelisted```: Topic on whitelist
2. ```post_topic_blacklisted```: Topic on blacklist

#### Content - Links

##### Numeric

1. ```post_num_links_video```: Number of video links
2. ```post_num_links_image```: Number of image links
3. ```post_num_links_page```: Number of webpage links
4. ```post_num_links_total```: Total number of links
5. ```post_num_link_domains_whitelisted```: Number of link domains on whitelist
6. ```post_num_link_domains_blacklisted```: Number of link domains on blacklist

##### Boolean

1. ```post_any_link_domains_whitelisted```: Any link domains on whitelist
2. ```post_any_link_domains_blacklisted```: Any link domains on blacklist

#### Content - Complex

##### Boolean

_Note: negligible text content is defined as less than ```MIN_WORDS_FOR_ARTICLE``` words, which is currently hard set to 100, but will be editable in a future release._

1. ```post_very_short```: Post has negligible text content with no links
2. ```post_images_only```: Post has negligible text content and mainly images
3. ```post_videos_only```: Post has negligible text content and mainly videos
4. ```post_mixed_links_only```: Post has negligible text content and a mix of link types

#### Author

##### Numeric

1. ```author_repuation```: Reputation (Stemit version, not direct from blockchain)

##### Proposed, not implemented

1. ```author_num_posts_today```: Number of posts today
2. ```author_last_post_time```: Time since last post in minutes