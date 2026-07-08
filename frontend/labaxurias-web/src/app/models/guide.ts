import { Medium } from './medium';
import { QueueItem } from './queue-item';

export interface Guide {

    id: string;

    name: string;

    mediumId: string;

    medium?: Medium;

    queue: QueueItem[];

    createdAt: string;

}