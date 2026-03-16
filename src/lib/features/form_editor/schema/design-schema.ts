import type { SectionSchema } from './types.js';

export const designSchema: SectionSchema = {
  groups: [
    // ── Page ───────────────────────────────────────────────────────────
    {
      title: 'Page',
      fields: [
        {
          path: ['page', 'size'],
          label: 'Page Size',
          type: 'toggle',
          options: [
            { value: 'a4', label: 'A4' },
            { value: 'us-letter', label: 'US Letter' }
          ]
        },
        { path: ['page', 'top_margin'], label: 'Top Margin', type: 'dimension' },
        { path: ['page', 'bottom_margin'], label: 'Bottom Margin', type: 'dimension' },
        { path: ['page', 'left_margin'], label: 'Left Margin', type: 'dimension' },
        { path: ['page', 'right_margin'], label: 'Right Margin', type: 'dimension' },
        { path: ['page', 'show_footer'], label: 'Show Footer', type: 'boolean' },
        { path: ['page', 'show_top_note'], label: 'Show Top Note', type: 'boolean' }
      ]
    },

    // ── Colors ─────────────────────────────────────────────────────────
    {
      title: 'Colors',
      fields: [
        { path: ['colors', 'body'], label: 'Body', type: 'color' },
        { path: ['colors', 'name'], label: 'Name', type: 'color' },
        { path: ['colors', 'headline'], label: 'Headline', type: 'color' },
        { path: ['colors', 'connections'], label: 'Connections', type: 'color' },
        { path: ['colors', 'section_titles'], label: 'Section Titles', type: 'color' },
        { path: ['colors', 'links'], label: 'Links', type: 'color' },
        { path: ['colors', 'footer'], label: 'Footer', type: 'color' },
        { path: ['colors', 'top_note'], label: 'Top Note', type: 'color' }
      ]
    },

    // ── Typography ─────────────────────────────────────────────────────
    {
      title: 'Typography',
      fields: [
        { path: ['typography', 'line_spacing'], label: 'Line Spacing', type: 'dimension' },
        {
          path: ['typography', 'alignment'],
          label: 'Alignment',
          type: 'alignment'
        },
        {
          path: ['typography', 'date_and_location_column_alignment'],
          label: 'Date/Location Alignment',
          type: 'alignment',
          options: 'position'
        }
      ]
    },

    // ── Font Family ────────────────────────────────────────────────────
    {
      title: 'Font Family',
      fields: [
        { path: ['typography', 'font_family', 'body'], label: 'Body', type: 'font' },
        { path: ['typography', 'font_family', 'name'], label: 'Name', type: 'font' },
        { path: ['typography', 'font_family', 'headline'], label: 'Headline', type: 'font' },
        {
          path: ['typography', 'font_family', 'connections'],
          label: 'Connections',
          type: 'font'
        },
        {
          path: ['typography', 'font_family', 'section_titles'],
          label: 'Section Titles',
          type: 'font'
        }
      ]
    },

    // ── Font Size ──────────────────────────────────────────────────────
    {
      title: 'Font Size',
      fields: [
        { path: ['typography', 'font_size', 'body'], label: 'Body', type: 'dimension' },
        { path: ['typography', 'font_size', 'name'], label: 'Name', type: 'dimension' },
        { path: ['typography', 'font_size', 'headline'], label: 'Headline', type: 'dimension' },
        {
          path: ['typography', 'font_size', 'connections'],
          label: 'Connections',
          type: 'dimension'
        },
        {
          path: ['typography', 'font_size', 'section_titles'],
          label: 'Section Titles',
          type: 'dimension'
        }
      ]
    },

    // ── Small Caps ─────────────────────────────────────────────────────
    {
      title: 'Small Caps',
      fields: [
        { path: ['typography', 'small_caps', 'name'], label: 'Name', type: 'boolean' },
        { path: ['typography', 'small_caps', 'headline'], label: 'Headline', type: 'boolean' },
        {
          path: ['typography', 'small_caps', 'connections'],
          label: 'Connections',
          type: 'boolean'
        },
        {
          path: ['typography', 'small_caps', 'section_titles'],
          label: 'Section Titles',
          type: 'boolean'
        }
      ]
    },

    // ── Bold ───────────────────────────────────────────────────────────
    {
      title: 'Bold',
      fields: [
        { path: ['typography', 'bold', 'name'], label: 'Name', type: 'boolean' },
        { path: ['typography', 'bold', 'headline'], label: 'Headline', type: 'boolean' },
        { path: ['typography', 'bold', 'connections'], label: 'Connections', type: 'boolean' },
        {
          path: ['typography', 'bold', 'section_titles'],
          label: 'Section Titles',
          type: 'boolean'
        }
      ]
    },

    // ── Links ──────────────────────────────────────────────────────────
    {
      title: 'Links',
      fields: [
        { path: ['links', 'underline'], label: 'Underline', type: 'boolean' },
        {
          path: ['links', 'show_external_link_icon'],
          label: 'Show External Link Icon',
          type: 'boolean'
        }
      ]
    },

    // ── Header ─────────────────────────────────────────────────────────
    {
      title: 'Header',
      fields: [
        {
          path: ['header', 'alignment'],
          label: 'Alignment',
          type: 'alignment',
          options: 'position'
        },
        { path: ['header', 'photo_width'], label: 'Photo Width', type: 'dimension' },
        {
          path: ['header', 'photo_position'],
          label: 'Photo Position',
          type: 'toggle',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' }
          ]
        },
        { path: ['header', 'photo_space_left'], label: 'Photo Space Left', type: 'dimension' },
        { path: ['header', 'photo_space_right'], label: 'Photo Space Right', type: 'dimension' },
        {
          path: ['header', 'space_below_name'],
          label: 'Space Below Name',
          type: 'dimension'
        },
        {
          path: ['header', 'space_below_headline'],
          label: 'Space Below Headline',
          type: 'dimension'
        },
        {
          path: ['header', 'space_below_connections'],
          label: 'Space Below Connections',
          type: 'dimension'
        }
      ]
    },

    // ── Header Connections ─────────────────────────────────────────────
    {
      title: 'Header Connections',
      fields: [
        {
          path: ['header', 'connections', 'phone_number_format'],
          label: 'Phone Number Format',
          type: 'toggle',
          options: [
            { value: 'national', label: 'National' },
            { value: 'international', label: 'International' },
            { value: 'E164', label: 'E.164' }
          ]
        },
        { path: ['header', 'connections', 'hyperlink'], label: 'Hyperlink', type: 'boolean' },
        { path: ['header', 'connections', 'show_icons'], label: 'Show Icons', type: 'boolean' },
        {
          path: ['header', 'connections', 'display_urls_instead_of_usernames'],
          label: 'Display URLs Instead of Usernames',
          type: 'boolean'
        },
        {
          path: ['header', 'connections', 'separator'],
          label: 'Separator',
          type: 'string',
          placeholder: '\u2022',
          preserveEmpty: true
        },
        {
          path: ['header', 'connections', 'space_between_connections'],
          label: 'Space Between Connections',
          type: 'dimension'
        }
      ]
    },

    // ── Section Titles ─────────────────────────────────────────────────
    {
      title: 'Section Titles',
      fields: [
        { path: ['section_titles', 'type'], label: 'Style', type: 'section_style' },
        {
          path: ['section_titles', 'line_thickness'],
          label: 'Line Thickness',
          type: 'dimension'
        },
        { path: ['section_titles', 'space_above'], label: 'Space Above', type: 'dimension' },
        { path: ['section_titles', 'space_below'], label: 'Space Below', type: 'dimension' }
      ]
    },

    // ── Sections ───────────────────────────────────────────────────────
    {
      title: 'Sections',
      fields: [
        { path: ['sections', 'allow_page_break'], label: 'Allow Page Break', type: 'boolean' },
        {
          path: ['sections', 'space_between_regular_entries'],
          label: 'Space Between Regular Entries',
          type: 'dimension'
        },
        {
          path: ['sections', 'space_between_text_based_entries'],
          label: 'Space Between Text Entries',
          type: 'dimension'
        },
        {
          path: ['sections', 'show_time_spans_in'],
          label: 'Show Time Spans In',
          type: 'string_list',
          placeholder: 'Section name',
          ordered: false
        }
      ]
    },

    // ── Entries ────────────────────────────────────────────────────────
    {
      title: 'Entries',
      fields: [
        {
          path: ['entries', 'date_and_location_width'],
          label: 'Date/Location Width',
          type: 'dimension'
        },
        { path: ['entries', 'side_space'], label: 'Side Space', type: 'dimension' },
        {
          path: ['entries', 'space_between_columns'],
          label: 'Column Spacing',
          type: 'dimension'
        },
        { path: ['entries', 'allow_page_break'], label: 'Allow Page Break', type: 'boolean' },
        {
          path: ['entries', 'short_second_row'],
          label: 'Short Second Row',
          type: 'boolean'
        },
        { path: ['entries', 'degree_width'], label: 'Degree Width', type: 'dimension' }
      ]
    },

    // ── Entry Summary ──────────────────────────────────────────────────
    {
      title: 'Entry Summary',
      fields: [
        {
          path: ['entries', 'summary', 'space_above'],
          label: 'Space Above',
          type: 'dimension'
        },
        {
          path: ['entries', 'summary', 'space_left'],
          label: 'Space Left',
          type: 'dimension'
        }
      ]
    },

    // ── Entry Highlights ───────────────────────────────────────────────
    {
      title: 'Entry Highlights',
      fields: [
        { path: ['entries', 'highlights', 'bullet'], label: 'Bullet', type: 'bullet' },
        {
          path: ['entries', 'highlights', 'nested_bullet'],
          label: 'Nested Bullet',
          type: 'bullet'
        },
        {
          path: ['entries', 'highlights', 'space_left'],
          label: 'Space Left',
          type: 'dimension'
        },
        {
          path: ['entries', 'highlights', 'space_above'],
          label: 'Space Above',
          type: 'dimension'
        },
        {
          path: ['entries', 'highlights', 'space_between_items'],
          label: 'Space Between Items',
          type: 'dimension'
        },
        {
          path: ['entries', 'highlights', 'space_between_bullet_and_text'],
          label: 'Space Between Bullet & Text',
          type: 'dimension'
        }
      ]
    },

    // ── Templates ──────────────────────────────────────────────────────
    {
      title: 'Templates',
      fields: [
        {
          path: ['templates', 'footer'],
          label: 'Footer',
          type: 'string',
          description: 'Placeholders: NAME, PAGE_NUMBER, TOTAL_PAGES, CURRENT_DATE'
        },
        {
          path: ['templates', 'top_note'],
          label: 'Top Note',
          type: 'string',
          description: 'Placeholders: LAST_UPDATED, CURRENT_DATE'
        },
        {
          path: ['templates', 'single_date'],
          label: 'Single Date',
          type: 'string',
          description:
            'Placeholders: MONTH_NAME, MONTH_ABBREVIATION, MONTH, MONTH_IN_TWO_DIGITS, DAY, DAY_IN_TWO_DIGITS, YEAR, YEAR_IN_TWO_DIGITS'
        },
        {
          path: ['templates', 'date_range'],
          label: 'Date Range',
          type: 'string',
          description: 'Placeholders: START_DATE, END_DATE'
        },
        {
          path: ['templates', 'time_span'],
          label: 'Time Span',
          type: 'string',
          description: 'Placeholders: HOW_MANY_YEARS, YEARS, HOW_MANY_MONTHS, MONTHS'
        }
      ]
    },

    // ── One-Line Entry Template ────────────────────────────────────────
    {
      title: 'One-Line Entry Template',
      fields: [
        {
          path: ['templates', 'one_line_entry', 'main_column'],
          label: 'Main Column',
          type: 'string',
          description: 'Placeholders: LABEL, DETAILS'
        }
      ]
    },

    // ── Education Entry Template ───────────────────────────────────────
    {
      title: 'Education Entry Template',
      fields: [
        {
          path: ['templates', 'education_entry', 'main_column'],
          label: 'Main Column',
          type: 'string',
          description:
            'Placeholders: INSTITUTION, AREA, DEGREE, DEGREE_WITH_AREA, SUMMARY, HIGHLIGHTS'
        },
        {
          path: ['templates', 'education_entry', 'degree_column'],
          label: 'Degree Column',
          type: 'string',
          description: 'Placeholders: DEGREE, DEGREE_WITH_AREA'
        },
        {
          path: ['templates', 'education_entry', 'date_and_location_column'],
          label: 'Date & Location Column',
          type: 'string',
          description: 'Placeholders: LOCATION, DATE'
        }
      ]
    },

    // ── Normal Entry Template ──────────────────────────────────────────
    {
      title: 'Normal Entry Template',
      fields: [
        {
          path: ['templates', 'normal_entry', 'main_column'],
          label: 'Main Column',
          type: 'string',
          description: 'Placeholders: NAME, SUMMARY, HIGHLIGHTS'
        },
        {
          path: ['templates', 'normal_entry', 'date_and_location_column'],
          label: 'Date & Location Column',
          type: 'string',
          description: 'Placeholders: LOCATION, DATE'
        }
      ]
    },

    // ── Experience Entry Template ──────────────────────────────────────
    {
      title: 'Experience Entry Template',
      fields: [
        {
          path: ['templates', 'experience_entry', 'main_column'],
          label: 'Main Column',
          type: 'string',
          description: 'Placeholders: COMPANY, POSITION, SUMMARY, HIGHLIGHTS'
        },
        {
          path: ['templates', 'experience_entry', 'date_and_location_column'],
          label: 'Date & Location Column',
          type: 'string',
          description: 'Placeholders: LOCATION, DATE'
        }
      ]
    },

    // ── Publication Entry Template ─────────────────────────────────────
    {
      title: 'Publication Entry Template',
      fields: [
        {
          path: ['templates', 'publication_entry', 'main_column'],
          label: 'Main Column',
          type: 'string',
          description: 'Placeholders: TITLE, AUTHORS, SUMMARY, DOI, URL, JOURNAL'
        },
        {
          path: ['templates', 'publication_entry', 'date_and_location_column'],
          label: 'Date & Location Column',
          type: 'string',
          description: 'Placeholders: DATE'
        }
      ]
    }
  ]
};
