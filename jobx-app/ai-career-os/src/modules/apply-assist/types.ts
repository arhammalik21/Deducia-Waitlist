export const MATCH_DIGEST_THRESHOLD = 0.55;
export const MATCH_DIGEST_LIMIT = 5;

export type ApplyAssistPack = {
  coverLetter: string;
  talkingPoints: string;
  emailSubject: string;
  emailBody: string;
};

export type ApplyAssistDraftJson = {
  coverLetter?: string;
  talkingPoints?: string | string[];
  emailSubject?: string;
  emailBody?: string;
};
