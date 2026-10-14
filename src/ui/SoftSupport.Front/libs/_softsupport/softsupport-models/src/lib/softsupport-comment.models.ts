import { REDACTION_ROLES } from './softsupport-roles';

export const COMMENT_ROLES: readonly string[] = REDACTION_ROLES;

export const COMMENT_REPLY_MAX_LENGTH = 4000;

export type CommentStatus = 'Pending' | 'Answered';

export interface CommentReply {
  id: number;
  from: string;
  message: string;
}

export interface CommentListItem {
  id: number;
  description: string;
  createdAt: string;
  articleId: number;
  articleCode: string | null;
  articleTitle: string;
  customerName: string;
  customerEmail: string;
  companyName: string | null;
  status: CommentStatus;
  replies: CommentReply[];
}

export interface CommentsQuery {
  page?: number;
  pageSize?: number;
  status?: CommentStatus | null;
  search?: string;
}
