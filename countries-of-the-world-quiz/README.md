# Countries of the World Quiz

[Live version](http://calebrob.com/countries-of-the-world-quiz/).

Based off of the [Sporcle Countries of the World Map Quiz](https://www.sporcle.com/games/g/world).

The trickiest part of this quiz game is identifying when an user enters a "correct" country name. While "Most Serene Republic of San Marino" is the official name of a country, "San Marino" should also be accepted as a "correct" name for this peaceful city state, for the sake of fun. I accomplish this by accepting the "common" or "official" names of each country in the https://github.com/mledoze/countries/ dataset and providing a way to easily add country aliases (send a pull request!). The following section describes how the matching process works in more detail.

## Mechanism for identifying "correct" country names

The `countries` variable from `countries.js` file is a list that contains an entry for each country in the quiz, e.g. `[39.622000,-98.606000,"United States","United States of America","USA"]` is the entry for the USA. Each entry is in the format `[Latitude, Longitude, Name 1, Name 2, ..., Name n]`. The quiz will accept any of `Name 1` through `Name n` (or their lowercase versions) as "correct" for the a given country, thus, to add an alias for a country, simply append the alias at the end of its entry. For example, I have manually added `USA` as an alias for `United States of America` in line 232 of `countries.js`.


To generate `countries.js` from scratch you must download the following files and unzip/move them to `data/` (i.e. `data/countries.json` and `data/TM_WORLD_BORDERS_SIMPL-0.3.shp` should exist), then run `countries_to_json.py` (warning this will overwrite the existing `countries.js` file):
- https://github.com/mledoze/countries/blob/master/dist/countries.json
- http://thematicmapping.org/downloads/TM_WORLD_BORDERS_SIMPL-0.3.zip

The `countries_to_json.py` script performs the following:
- Loads the latitude and longitude coordinates from each country in `TM_WORLD_BORDERS_SIMPL-0.3.shp` by their ISO3 codes.
- Matches the previously loaded ISO3 codes to the `countries.json` file from the https://github.com/mledoze/countries/ dataset, then extracts the country's "common" and "official" names.
- Writes each matched country to `countries.js`.