export class Return extends Error {
  value: unknown;

  constructor(value: unknown) {
    super();
    this.value = value;
  }
}
