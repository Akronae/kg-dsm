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
        "vertialPadding": "{sem.container.padding}",
        "horizontalPadding": "{sem.container.padding}",
        "itemSpacing": "{sem.conainer.spacing}"
      },
      "type": "composition"
    },
    "text": {
      "value": {
        "typography": "{sem.typography.textStyle.label.body.sm}",
        "fill": "{sem.colorText.<< ({white: 'dark', greyLight: 'dark', redLight: 'danger'})[size] || 'light' >>}"
      },
      "type": "composition"
    }
  }
]