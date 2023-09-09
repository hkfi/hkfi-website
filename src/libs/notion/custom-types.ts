import type { MultiSelectPropertyItemObjectResponse } from "@notionhq/client/build/src/api-endpoints";


export type SelectPropertyResponse =
  MultiSelectPropertyItemObjectResponse['multi_select'][number]