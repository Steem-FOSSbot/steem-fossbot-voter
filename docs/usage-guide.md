# Usage Guide

## Creating a good algorithm

A good algorithm starts with a hypothesis about what makes a good post. This should ideally be a balance between what gets good payout, and what describes "good" content.

### Example 1, long form articles

As an example, let's say I like long form articles about interesting subjects, I see they get good rewards and I think they contribute to the culture of Steem. So I hypothesise that good long form articles have more than 200 words, some images, not too many videos and that the best ones are usually written by someone with a bit of reputation, they've been here a while. Also, they are in English, because I cannot read another language and so would not vote for any in another language naturally.

In that case I might set the following algorithm:
- ```post_num_words in range 200 to 600, weight = 0.5```
- ```post_num_links_image in range 0 to 5, weight = 10```
- ```post_num_links_video, weight = -25```
- ```author_repuation, weight = 1```
- ```post_has_english_language_use, weight = 50```

We're using ranges here in some cases to make the metric values more sensible. We don't care if there are more than 5 images, and don't want to over score based on that. This is similar for number of words range. Also note that the ```post_has_english_language_use``` is a true or false, so if true then 50 will be added to score, if false nothing will.

### Example 2, artistic posts

Perhaps we're just interested in artistic posts. The hypothesis is that these kind of posts are pretty much just images with maybe a little text. The more images the better, the more words the less good.

- ```post_num_words, weight = -1```
- ```post_images_only, weight = 500```
- ```post_num_links_image, weight = 20```

So for every word we loose 1 score point. If the post is images only (less than 100 words) then we add 500, which is a lot but will high skew the score up for these kind of posts which we're mostly interested in. Additionally we add 20 for every image.

### Example 3, the sell out

Say we just care about curation rewards and want to maximise that, completely disregarding content. Our hypothesis could be that certain authors consistently get high curation rewards, so with our Steem account we follow them and then use one metric only:

- ```author_is_followed```, weight = 1000

If the author is followed, their posts will always be voted on, up to our daily limit.

## Reflection on the examples

The first two examples are contradictory in goals and represent two completely different ways of looking at quality. The interesting thing is that both of these kinds of posts might do very well and get good rewards, our hypothesis could be right in either case. What I like about them is that they are also heavily cultural.

The last example is very simple and might be effective, but it is not really intelligent. If the authors I follow stop producing content, or their content becomes poor quality, or even post too much, this will stop working. The problem with that approach is that it cannot react to changes in the system. However the first two methods will always look for different posts which fit the criteria.

In summary, I recommend you try to find out how to translate an idea you have about post quality that is a bit deeper than just who and what is popular _now_, because I've personally seen that Steem is very dynamic and changes a lot, even from week to week.

## Reflexivity with tests and stats

In order check if you algorithm is working you can perform a test run to get an idea of the scoring your algorithm and other settings will produce.

When the bot has actually run a few times, you can check the stats to see how things are going and adjust the algorithm accordingly. Perhaps your approach is not working at all, or maybe your weights are just off. It could be that one metric is contributing too much or not enough to the overall score. You can check this with the metric break down chart, pictured here:

I've used this and found it to be effective in improving algorithm design.
