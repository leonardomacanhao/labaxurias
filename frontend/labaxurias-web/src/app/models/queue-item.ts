export interface QueueItem {

    id: string;

    clientName: string;

    spiritualGuideId: string;

    order: number;

    createdAt: string;

    isCalled: boolean;

    calledAt?: string;

}