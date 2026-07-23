import { Medium } from './medium';

export interface Guide {

    id: string;

    name: string;

    mediumId: string;

    medium?: Medium;

    createdAt: string;

}
