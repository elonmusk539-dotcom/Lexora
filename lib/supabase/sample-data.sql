-- Sample data for Lexora vocabulary app
-- Run this after running schema.sql

-- Insert a sample vocabulary list
INSERT INTO vocabulary_lists (name, description, language) VALUES
('Common Japanese Greetings', 'Basic greetings and everyday expressions', 'japanese'),
('Numbers 1-10', 'Learn to count from 1 to 10 in Japanese', 'japanese');

-- Get the IDs (you'll need to replace these with actual IDs from your database)
-- Or use the Supabase dashboard to insert words with the correct list_id

-- Sample vocabulary words structure:
-- For testing, you can insert words like this (replace 'your-list-id' with actual UUID):

-- INSERT INTO vocabulary_words (
--   list_id, 
--   word, 
--   reading, 
--   meaning, 
--   image_url, 
--   pronunciation_url, 
--   examples
-- ) VALUES (
--   'your-list-id',
--   'こんにちは',
--   'konnichiwa',
--   'Hello',
--   'https://res.cloudinary.com/your-cloud/image/upload/v1/hello.jpg',
--   'https://res.cloudinary.com/your-cloud/video/upload/v1/hello.mp3',
--   ARRAY[
--     'こんにちは、田中さん。- Hello, Tanaka-san.',
--     'こんにちは、元気ですか？ - Hello, how are you?',
--     '午後はいつもこんにちはと言います。 - In the afternoon, we always say hello.',
--     'こんにちは、お会いできて嬉しいです。 - Hello, nice to meet you.',
--     '先生、こんにちは。 - Hello, teacher.'
--   ]
-- );

/* 
SAMPLE DATA STRUCTURE FOR MANUAL ENTRY:

List 1: Common Japanese Greetings
--------------------------------

1. こんにちは (konnichiwa) - Hello
   Examples:
   - こんにちは、田中さん。
   - こんにちは、元気ですか？
   - 午後はいつもこんにちはと言います。
   - こんにちは、お会いできて嬉しいです。
   - 先生、こんにちは。

2. ありがとう (arigatou) - Thank you
   Examples:
   - ありがとう、助かりました。
   - 本当にありがとう。
   - ありがとう、また会いましょう。
   - プレゼントをありがとう。
   - いつもありがとう。

3. さようなら (sayounara) - Goodbye
   Examples:
   - さようなら、また明日。
   - さようなら、良い一日を。
   - 友達にさようならを言った。
   - さようなら、気をつけて。
   - みんなにさようならと言いました。

4. おはよう (ohayou) - Good morning
   Examples:
   - おはよう、よく眠れた？
   - おはようございます、先生。
   - 朝はおはようと挨拶します。
   - おはよう、今日も頑張ろう。
   - おはよう、良い天気ですね。

5. おやすみ (oyasumi) - Good night
   Examples:
   - おやすみ、また明日。
   - おやすみなさい、良い夢を。
   - 子供におやすみと言った。
   - おやすみ、ゆっくり休んでね。
   - おやすみなさい、みなさん。

IMAGE & AUDIO RESOURCES:
- Use Cloudinary or any CDN for hosting images
- For images: Search for free Japanese vocabulary images
- For audio: Use text-to-speech services or record yourself
- Recommended: Google Cloud Text-to-Speech for Japanese

PLACEHOLDER URLS (replace with real ones):
- Image: https://via.placeholder.com/400x300?text=Word+Image
- Audio: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
*/

-- After adding data, verify with:
-- SELECT * FROM vocabulary_lists;
-- SELECT * FROM vocabulary_words;
