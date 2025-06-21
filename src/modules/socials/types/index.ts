// Shared types for the socials module

export type SupportedProvider = 'twitter' | 'facebook' | 'instagram' | 'linkedin';

export interface ConnectionResult {
    success: boolean;
    message?: string;
    data?: any;
}

export interface PostData {
    content: string;
    hashtags?: string[];
    mediaFiles?: Array<{
        name: string;
        type: string;
        file_path: string;
    }>;
}

export interface FormattedPost {
    post: string;
    platform: string;
    date: string;
    likes: number;
    comments: number;
    shares: number;
    reach: number | null;
    engagementRate: string;
    actions: Record<string, any>;
}

export interface MessageBody {
    conversationId: string;
    text: string;
} 