import type { BaseEntity } from "./entity";

export interface UserInterestBaseDto {
  userId: number;
  categoryId: number;
  markedAt: string;
}

export type CreateUserInterestRequest = UserInterestBaseDto;

export interface UserInterestDto extends BaseEntity, UserInterestBaseDto {}
