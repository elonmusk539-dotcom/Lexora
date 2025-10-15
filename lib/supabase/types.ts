export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      vocabulary_lists: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          language: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          language?: string;
          created_at?: string;
        };
      };
      vocabulary_words: {
        Row: {
          id: string;
          list_id: string;
          word: string;
          reading: string | null;
          meaning: string;
          image_url: string;
          pronunciation_url: string;
          examples: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          word: string;
          reading?: string | null;
          meaning: string;
          image_url: string;
          pronunciation_url: string;
          examples: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          word?: string;
          reading?: string | null;
          meaning?: string;
          image_url?: string;
          pronunciation_url?: string;
          examples?: string[];
          created_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          correct_streak: number;
          is_mastered: boolean;
          last_reviewed: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          correct_streak?: number;
          is_mastered?: boolean;
          last_reviewed?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          word_id?: string;
          correct_streak?: number;
          is_mastered?: boolean;
          last_reviewed?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
