export class ResError extends Error {
  constructor(public message: string, public meta?: { [key: string]: any }) {
    super(message)
  }
}
