import type { Heading1BlockObjectResponse, Heading2BlockObjectResponse, Heading3BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints"

type HeadingBlockObjectResponse = Heading1BlockObjectResponse | Heading2BlockObjectResponse | Heading3BlockObjectResponse

export const buildHeadingId = (block: HeadingBlockObjectResponse) => {
  const heading = 'heading_1' in block ? block.heading_1 : 'heading_2' in block ? block.heading_2 : block.heading_3

  return heading.rich_text.map((richText) => {
    if (!('text' in richText)) {
      return ''
    }
    return richText.plain_text
  }).join('').trim()
}
