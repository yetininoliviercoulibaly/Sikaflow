
export class EventFeedback {
  constructor(
    public id: string,
    public eventId: string,
    public attendeePhone: string,
    public rating: number, // 1-5
    public comment: string | null,
    public createdAt: Date,
  ) {}
}
