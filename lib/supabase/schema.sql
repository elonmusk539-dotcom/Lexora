-- This file contains the SQL schema for the Supabase database
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (automatically created by Supabase Auth)
-- We'll use the auth.users table

-- Vocabulary Lists table
create table vocabulary_lists (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  language text not null default 'japanese',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table vocabulary_lists enable row level security;

-- Create policy for public read access to lists
create policy "Anyone can view vocabulary lists"
  on vocabulary_lists for select
  using (true);

-- Vocabulary Words table
create table vocabulary_words (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references vocabulary_lists(id) on delete cascade not null,
  word text not null,
  reading text,
  meaning text not null,
  image_url text not null,
  pronunciation_url text not null,
  examples text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table vocabulary_words enable row level security;

-- Create policy for public read access to words
create policy "Anyone can view vocabulary words"
  on vocabulary_words for select
  using (true);

-- User Progress table
create table user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  word_id uuid references vocabulary_words(id) on delete cascade not null,
  correct_streak integer not null default 0,
  is_mastered boolean not null default false,
  last_reviewed timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, word_id)
);

-- Enable Row Level Security
alter table user_progress enable row level security;

-- Create policy for users to manage their own progress
create policy "Users can view their own progress"
  on user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on user_progress for update
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index idx_vocabulary_words_list_id on vocabulary_words(list_id);
create index idx_user_progress_user_id on user_progress(user_id);
create index idx_user_progress_word_id on user_progress(word_id);
create index idx_user_progress_is_mastered on user_progress(is_mastered);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_user_progress_updated_at
  before update on user_progress
  for each row
  execute function update_updated_at_column();
