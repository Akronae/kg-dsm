// @replacepath: tokens/comp.web.json

comp
.tag
[color: 'primary' | 'black' | 'grey' | 'greyLight' | 'white' | 'blue' | 'green' | 'greenDark' | 'red' | 'redDark' | 'redLight' | 'blue' ]
[
  {
    "container": {
      "value": {
        "borderRadius": "{sem.tag.container.borderRadius}",
        "fill": "{sem.colorTag.<<color>>}",
        "vertialPadding": "{sem.tag.container.padding}",
        "horizontalPadding": "{sem.tag.container.padding}",
        "itemSpacing": "{sem.tag.container.spacing}"
      },
      "type": "composition"
    },
    "text": {
      "value": {
        "typography": "{sem.typography.textStyle.label.body.sm}",
        "fontWaight": "{ref.typography.fontWeight.700}",
        "fill": "{sem.colorText.<< ({white: 'dark', greyLight: 'dark', redLight: 'danger'})[color] || 'light' >>}"
      },
      "type": "composition"
    }
  }
]