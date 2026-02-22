declare module '@jscad/stl-serializer' {
  interface SerializeOptions {
    binary?: boolean;
  }

  export function serialize(options: SerializeOptions, ...geometries: unknown[]): ArrayBuffer[];
}
