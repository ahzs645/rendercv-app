# ruff: noqa: F821

from dataclasses import asdict
from io import StringIO

from ruamel.yaml import YAML

from rendercv.exception import RenderCVUserValidationError
from rendercv.renderer.templater.templater import render_full_template
from rendercv.schema.rendercv_model_builder import (
    BuildRendercvModelArguments,
    build_rendercv_dictionary_and_model,
)

yaml_input_cv: str  # Set by Pyodide via pyodide.globals.set()
yaml_input_design: str
yaml_input_locale: str
yaml_input_settings: str

PREFERRED_FLAVORS = ["consulting_onepage", "default"]
SUPPORTED_SOCIAL_NETWORKS = {
    "LinkedIn",
    "GitHub",
    "GitLab",
    "IMDB",
    "Instagram",
    "ORCID",
    "Mastodon",
    "StackOverflow",
    "ResearchGate",
    "YouTube",
    "Google Scholar",
    "Telegram",
    "WhatsApp",
    "Leetcode",
    "X",
    "Bluesky",
}
CUSTOM_CONNECTION_ICONS = {
    "Facebook": "facebook-f",
}
POSITION_SPACING_SAME_MARKER = "RCVSPACINGSAME:"
POSITION_SPACING_DIFF_MARKER = "RCVSPACINGDIFF:"
MONTH_NAMES = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
}
HEADER_CONNECTION_ICON_HELPER = """
#let rendercv-brand-connection-icons = (
  "linkedin",
  "github",
  "gitlab",
  "imdb",
  "instagram",
  "mastodon",
  "orcid",
  "stack-overflow",
  "researchgate",
  "youtube",
  "telegram",
  "whatsapp",
  "x-twitter",
  "bluesky",
  "reddit",
)

#let connection-with-icon(icon-name, body) = {
  let icon = if rendercv-brand-connection-icons.contains(icon-name) {
    fa-icon(icon-name, font: "Font Awesome 7 Brands")
  } else {
    fa-icon(icon-name, solid: true)
  }
  [#icon #h(0.05cm) #box[#body]]
}
"""

YAML_LOADER = YAML(typ="safe", pure=True)
YAML_DUMPER = YAML()
YAML_DUMPER.default_flow_style = False
YAML_DUMPER.allow_unicode = True
YAML_DUMPER.sort_base_mapping_type_on_output = False


def safe_load_yaml(text):
    return YAML_LOADER.load(text)


def safe_dump_yaml(data):
    output = StringIO()
    YAML_DUMPER.dump(data, output)
    return output.getvalue()


def join_parts(parts, separator=" · "):
    values = []
    for part in parts:
        if part is None:
            continue
        text = str(part).strip()
        if text:
            values.append(text)
    if not values:
        return None
    return separator.join(values)


def clean_mapping(mapping):
    cleaned = {}
    for key, value in mapping.items():
        if value is None or value == []:
            continue
        cleaned[key] = value
    return cleaned


def stringify_numbers(value):
    if isinstance(value, dict):
        return {key: stringify_numbers(item) for key, item in value.items()}
    if isinstance(value, list):
        return [stringify_numbers(item) for item in value]
    if isinstance(value, (int, float)):
        return str(value)
    return value


def pick_flavor_value(value):
    if not isinstance(value, dict) or "flavors" not in value:
        return value

    flavors = value["flavors"]
    if not isinstance(flavors, dict) or not flavors:
        return value

    for flavor_name in PREFERRED_FLAVORS:
        selected = flavors.get(flavor_name)
        if selected not in (None, [], ""):
            return selected

    return next(iter(flavors.values()))


def normalize_flavored_fields(entry):
    if not isinstance(entry, dict):
        return entry

    normalized = dict(entry)
    for field_name, field_value in list(normalized.items()):
        if isinstance(field_value, dict) and "flavors" in field_value:
            normalized[field_name] = pick_flavor_value(field_value)

    return normalized


def strip_compat_fields(entry):
    if not isinstance(entry, dict):
        return entry

    normalized = dict(entry)
    normalized.pop("itags", None)
    normalized.pop("tags", None)
    return normalized


def format_date_for_display(date_string):
    if not date_string:
        return ""

    normalized = str(date_string).strip()
    if not normalized:
        return ""

    if normalized.lower() == "present":
        return "Present"

    parts = normalized.split("-")
    if len(parts) == 1:
        return parts[0]

    if len(parts) >= 2:
        year = parts[0]
        month_name = MONTH_NAMES.get(parts[1].zfill(2))
        if month_name:
            return f"{month_name} {year}"

    return normalized


def format_date_range_for_display(start_date, end_date):
    start = format_date_for_display(start_date)
    end = format_date_for_display(end_date)
    if start and end:
        return f"{start} – {end}"
    return start or end


def select_company_start_date(positions):
    start_dates = [pos.get("start_date") for pos in positions if pos.get("start_date")]
    if not start_dates:
        return None
    return min(str(date) for date in start_dates)


def select_company_end_date(positions):
    end_dates = [str(pos.get("end_date")) for pos in positions if pos.get("end_date")]
    if not end_dates:
        return None

    if any(date.lower() == "present" for date in end_dates):
        return "present"

    return max(end_dates)


def normalize_position_title(position):
    return str(position.get("title", position.get("position", ""))).strip()


def expand_nested_positions(entry):
    if not isinstance(entry, dict):
        return [entry]

    normalized_entry = strip_compat_fields(normalize_flavored_fields(entry))
    positions = normalized_entry.get("positions")
    if not isinstance(positions, list):
        normalized_entry.pop("show_date_in_position", None)
        return [clean_mapping(normalized_entry)]

    visible_positions = []
    for position in positions:
        if not isinstance(position, dict):
            continue
        visible_positions.append(strip_compat_fields(normalize_flavored_fields(position)))

    if not visible_positions:
        return []

    base_entry = dict(normalized_entry)
    show_date_in_position = bool(base_entry.pop("show_date_in_position", False))
    base_entry.pop("positions", None)

    company_start_date = select_company_start_date(visible_positions)
    company_end_date = select_company_end_date(visible_positions)
    include_position_dates = len(visible_positions) > 1 or show_date_in_position

    expanded = []
    for index, position in enumerate(visible_positions):
        item = dict(base_entry)

        position_title = normalize_position_title(position) or str(item.get("position", "")).strip()
        position_text = position_title

        if include_position_dates and position_title:
            position_date_range = format_date_range_for_display(
                position.get("start_date"), position.get("end_date")
            )
            if position_date_range:
                position_text = f"{position_title} | {position_date_range}"

        marker = (
            POSITION_SPACING_SAME_MARKER
            if index < len(visible_positions) - 1
            else POSITION_SPACING_DIFF_MARKER
        )
        if position_text:
            item["position"] = f"{marker}{position_text}"

        if index == 0:
            if company_start_date:
                item["start_date"] = company_start_date
            elif position.get("start_date"):
                item["start_date"] = position["start_date"]

            if company_end_date:
                item["end_date"] = company_end_date
            elif position.get("end_date"):
                item["end_date"] = position["end_date"]
        else:
            item["company"] = ""
            if position.get("start_date"):
                item["start_date"] = position["start_date"]
            if position.get("end_date"):
                item["end_date"] = position["end_date"]

        if position.get("summary"):
            item["summary"] = position["summary"]
        if position.get("highlights"):
            item["highlights"] = position["highlights"]
        if position.get("location"):
            item["location"] = position["location"]

        expanded.append(clean_mapping(item))

    return expanded


def normalize_publications(entries):
    normalized_entries = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue

        item = strip_compat_fields(normalize_flavored_fields(entry))
        authors = item.get("authors")
        if isinstance(authors, dict) and "flavors" in authors:
            authors = pick_flavor_value(authors)
        if authors and not isinstance(authors, list):
            authors = [authors]

        journal = None
        if item.get("journal"):
            journal = str(item["journal"]).strip()
            volume = item.get("volume")
            issue = item.get("issue")
            if volume and issue:
                journal = f"{journal}, {volume}({issue})"
            elif volume:
                journal = f"{journal}, {volume}"
        else:
            journal = join_parts([item.get("institution"), item.get("type")])

        publication = {
            "title": item.get("title"),
            "authors": authors,
            "journal": journal,
            "date": item.get("date"),
            "doi": item.get("doi"),
            "summary": join_parts(
                [
                    item.get("summary"),
                    f"Editor: {item['editor']}" if item.get("editor") else None,
                    item.get("publisher"),
                    f"Pages: {item['pages']}" if item.get("pages") else None,
                ]
            ),
        }
        normalized_entries.append(clean_mapping(publication))

    return normalized_entries


def normalize_supervisory_activities(entries):
    normalized_entries = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue

        if "label" in entry and "details" in entry:
            normalized_entries.append(clean_mapping(entry))
            continue

        for key, value in entry.items():
            if value is None:
                continue
            normalized_entries.append(
                {
                    "label": str(key).replace("_", " ").title(),
                    "details": str(value),
                }
            )

    return normalized_entries


def normalize_social_connections(cv_data):
    if not isinstance(cv_data, dict) or cv_data.get("social_networks") is not None:
        return

    social_entries = cv_data.pop("social", None)
    if not isinstance(social_entries, list):
        return

    social_networks = []
    custom_connections = list(cv_data.get("custom_connections") or [])

    for entry in social_entries:
        if not isinstance(entry, dict):
            continue

        network = entry.get("network")
        username = entry.get("username")
        url = entry.get("url")

        if network in SUPPORTED_SOCIAL_NETWORKS and username:
            social_networks.append({"network": network, "username": username})
            continue

        if network and (username or url):
            custom_connections.append(
                {
                    "fontawesome_icon": CUSTOM_CONNECTION_ICONS.get(network, "link"),
                    "placeholder": username or network,
                    "url": url,
                }
            )

    if social_networks:
        cv_data["social_networks"] = social_networks
    if custom_connections:
        cv_data["custom_connections"] = custom_connections


def patch_header_connection_icons(typst_content):
    if "#connection-with-icon(" not in typst_content:
        return typst_content

    marker = "\n#connections("
    if marker not in typst_content:
        return typst_content

    return typst_content.replace(
        marker,
        f"\n{HEADER_CONNECTION_ICON_HELPER}\n#connections(",
        1,
    )


def normalize_cv_yaml(yaml_text):
    parsed = safe_load_yaml(yaml_text)
    if not isinstance(parsed, dict):
        return yaml_text

    cv_data = parsed.get("cv")
    if not isinstance(cv_data, dict):
        return yaml_text

    normalize_social_connections(cv_data)

    sections = cv_data.get("sections")
    if isinstance(sections, dict):
        for section_name, entries in list(sections.items()):
            if not isinstance(entries, list):
                continue

            if section_name == "publications":
                sections[section_name] = normalize_publications(entries)
                continue

            if section_name == "supervisory_activities":
                sections[section_name] = normalize_supervisory_activities(entries)
                continue

            normalized_entries = []
            for entry in entries:
                normalized_entries.extend(expand_nested_positions(entry))
            sections[section_name] = normalized_entries

    return safe_dump_yaml(stringify_numbers(parsed))


normalized_yaml_input_cv = normalize_cv_yaml(yaml_input_cv)


def strip_position_markers(cv_yaml_text):
    parsed = safe_load_yaml(cv_yaml_text)
    if not isinstance(parsed, dict):
        return cv_yaml_text

    cv_data = parsed.get("cv")
    if not isinstance(cv_data, dict):
        return cv_yaml_text

    sections = cv_data.get("sections")
    if not isinstance(sections, dict):
        return cv_yaml_text

    for entries in sections.values():
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            position = entry.get("position")
            if not isinstance(position, str):
                continue
            if position.startswith(POSITION_SPACING_SAME_MARKER):
                entry["position"] = position[len(POSITION_SPACING_SAME_MARKER):]
            elif position.startswith(POSITION_SPACING_DIFF_MARKER):
                entry["position"] = position[len(POSITION_SPACING_DIFF_MARKER):]

    return safe_dump_yaml(parsed)


design_parsed = safe_load_yaml(yaml_input_design)
theme_name = ""
if isinstance(design_parsed, dict) and isinstance(design_parsed.get("design"), dict):
    theme_name = str(design_parsed["design"].get("theme", ""))

if theme_name != "ahmadstyle":
    normalized_yaml_input_cv = strip_position_markers(normalized_yaml_input_cv)

kwargs: BuildRendercvModelArguments = {}
kwargs["design_yaml_file"] = yaml_input_design
kwargs["locale_yaml_file"] = yaml_input_locale
kwargs["settings_yaml_file"] = yaml_input_settings

try:
    dictionary, model = build_rendercv_dictionary_and_model(
        normalized_yaml_input_cv,
        **kwargs,
    )
except RenderCVUserValidationError as e:
    formatted_errors = []
    for error in e.validation_errors:
        formatted_errors.append(asdict(error))
    result = {
        "content": None,
        "errors": formatted_errors,
        "normalized_cv": normalized_yaml_input_cv,
    }
except Exception as e:
    result = {
        "content": None,
        "errors": [
            {
                "message": str(e),
                "schema_location": [],
                "input": "",
                "yaml_source": "main_yaml_file",
                "yaml_location": None,
            }
        ],
        "normalized_cv": normalized_yaml_input_cv,
    }
else:
    typst_content = render_full_template(model, "typst")
    result = {
        "content": patch_header_connection_icons(typst_content),
        "errors": None,
        "normalized_cv": normalized_yaml_input_cv,
    }

result
