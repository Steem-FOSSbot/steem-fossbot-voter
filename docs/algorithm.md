# Algorithm and metrics

The factors influencing whether or not a post is choosen to be voted on _must be measureable_. These measurements are called **metrics**.

Metrics are facts of the Steem posts and environment, such as word count, number of votes already cast, whether the author is followed, etc.

The **algorithm** is a customizable process which each user can tweak to make their own bot curate as they would like it to curation. It is intended to be an approximate model of how you usually vote.

Most strategic metrics are simply readable from the API, but cultural metrics are harder to quantify, necessarily requiring the use of Natural Language Processing (NLP) and other tools.

### Metrics

Each metric must be either numeric or boolean (true or false). Numeric metrics are values like the number of words in a post, the number of votes, the . Boolean metrics come from questions like "Does the user follow the author of this post?".

The actual metrics used are detailed below.

### Algorithm

The algorithm combines metrics into a single score using metric values at a certain weight (i.e. multiplication factor) and optionally within a certain range. It is also useful to add some conditions to the algorithm in general.

The weights scale metric values in order to change the contributing effect of a metric. They can also be used to make a  value more reasonable.

Bounding a metric value to a range also makes the value more reasonable. You may want to cap the word count having an effect on a increasing the overall score at 2000 words for example.

#### Polynomial

If we set the conditions aside, the algorithm is simply a [polynomial](https://en.wikipedia.org/wiki/Polynomial). For example:

Let ```M``` be the set of metrics such that ```m[1]``` is the first metric, ```m[2]``` is the second, etc. until ```m[n-1]``` is the second last and ```m[n]``` is the last, where ```n``` is the number of metrics.

If range is to be applied, let ```l``` be the lower bound value and ```u``` be the upper value. Then apply the following:

```for each m at index i
	if m[i] < l then m[i] = l
	if m[i] > u then m[i] = u```

Let ```W``` be the set of weights applied to each metric, also of size ```n```.

Then, the algorithm which produces a score ```s``` would be

```s = w[1]*m[1] + w[2]*m[2] + ... + w[n-1]*m[n-1] + w[n]*m[n]```

#### Conditions

It is also useful to have a set of conditions which will veto the above weighted metric scoring. For example, we may not want to vote for a post with too few words or with video links, or to always vote for a post by a certain author. This is a similar concept to a black and white list respectively.

To test numeric metric values, we can use the usual operators to turn values into boolean, such as equality, inequality, less than (or equal to) and greater than (or equal to).

However, to further complicate this, what if an author on the white list has a video post? Perhaps we want the author to be voted for more than we want to exclude video posts. To allow for this, we can use **priority** levels for conditions.

Thus we have the possibilities:

```[White / Black]-list : [mostly / always]```

To apply this to our example, video posts should be mostly black-listed and posts by a certain author always white-listed. If there is a video post by a different author, it will be black-listed. If it's by our preferred author, it will be white-listed.

Blacklisting will have the effect of setting the score to the minimum possible value, i.e. ```0```. Whitelisting will set the score to the maximum value (probably for an unsigned 32 bit integer, i.e. ```(2^32)-1```).

## Metrics used

### Strategic metrics

_Note: All metrics current at time of metric sample_

#### About the post

1. Time since post
2. Estimated payout
3. Number of votes
4. Number of flags / downvotes

#### About this user
1. Number of posts today
2. Time since last post

### Cultural metrics

#### Content - Text

_Using NLP_

1. Topic
2. Keywords
3. Sentiment / emotional score
4. Length
5. Presence of any / number of whitelist words
6. Presence of any / number of blacklist words

#### Content - Links
1. Number of video links
2. Number of photo links
3. Number of webpage links
4. Total number of links
5. Presence of any / number of whitelist domains
6. Presence of any / number of blacklist domains

#### Poster

1. Reputation
2. Capital (either by value or by category, whale, dolphin, minnow)
3. Last post payout
4. Average / median post payout
5. Presence of author on whitelist
6. Presence of author on blacklist