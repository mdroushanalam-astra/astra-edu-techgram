// Generated private teaching/assessment assets. Never import into frontend.
export const geographyUnits = {
  "version": "geography-units-1-2bf8c23e925a",
  "status": "seed; subject review pending",
  "sourceVersion": "geography-master-v1-e774ee652c37",
  "units": [
    {
      "id": "atmosphere",
      "title": "Atmospheric foundations",
      "conceptIds": [
        "gu_energy",
        "gu_pressure",
        "gu_moisture",
        "gu_orographic"
      ]
    },
    {
      "id": "geomorphology",
      "title": "Geomorphology and river systems",
      "conceptIds": [
        "gu_forces",
        "gu_weathering",
        "gu_erosion",
        "gu_transport",
        "gu_deposition",
        "gu_landforms",
        "gu_slope",
        "gu_agents",
        "gu_human",
        "gu_governance"
      ]
    },
    {
      "id": "maps_motions",
      "title": "Maps, coordinates and Earth motions",
      "conceptIds": [
        "gu_coordinates",
        "gu_scale",
        "gu_projection",
        "gu_motions"
      ]
    },
    {
      "id": "monsoon",
      "title": "Monsoon circulation and variability",
      "conceptIds": [
        "gu_monsoon",
        "gu_variability"
      ]
    }
  ],
  "concepts": [
    {
      "id": "gu_energy",
      "name": "Insolation and heat balance",
      "prereqs": [
        "gu_motions"
      ],
      "section": "7.2",
      "mechanism": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "example": "Dark and bright surfaces can absorb different fractions of the same sunlight. Cloud and atmosphere also modify the energy reaching and leaving the surface.",
      "mistake": "Incoming radiation is not all absorbed, and greenhouse warming is not the same mechanism as an ozone hole.",
      "nodes": [
        "Incoming sunlight",
        "Reflect or absorb",
        "Transfer and emit"
      ],
      "unit": "atmosphere"
    },
    {
      "id": "gu_pressure",
      "name": "Pressure gradients and winds",
      "prereqs": [
        "gu_energy"
      ],
      "section": "7.4",
      "mechanism": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "example": "Near a coast, different heating of land and sea can help produce a pressure contrast and a breeze. Local circulation also depends on surrounding conditions.",
      "mistake": "Wind is not simply a direct movement from every hot place to every cold place.",
      "nodes": [
        "Pressure difference",
        "Forces and friction",
        "Air movement"
      ],
      "unit": "atmosphere"
    },
    {
      "id": "gu_moisture",
      "name": "Humidity, cooling and condensation",
      "prereqs": [
        "gu_energy"
      ],
      "section": "7.5",
      "mechanism": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "example": "Air can reach saturation as it cools without adding water vapour. Dew point describes the cooling needed under approximately constant pressure and moisture content.",
      "mistake": "High moisture by itself is not proof that rainfall will occur, and relative humidity is temperature-dependent.",
      "nodes": [
        "Moist air",
        "Cooling toward saturation",
        "Condensation conditions"
      ],
      "unit": "atmosphere"
    },
    {
      "id": "gu_orographic",
      "name": "Orographic lifting and rain shadows",
      "prereqs": [
        "gu_pressure",
        "gu_moisture"
      ],
      "section": "7.5",
      "mechanism": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "example": "Changing the prevailing moist wind from west to east can change which mountain slope is windward. Rainfall still depends on moisture and atmospheric conditions.",
      "mistake": "Altitude alone cannot identify a rain shadow or the wettest slope.",
      "nodes": [
        "Moist wind rises",
        "Cooling and possible rain",
        "Lee descent and warming"
      ],
      "unit": "atmosphere"
    },
    {
      "id": "gu_forces",
      "name": "Internal and surface forces",
      "prereqs": [],
      "section": "6.1",
      "mechanism": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "example": "A mountain belt can rise through tectonics while rivers incise valleys in it. Uplift and erosion can operate together.",
      "mistake": "Uplift does not mean erosion stops; surface change is not explained by one force alone.",
      "nodes": [
        "Internal deformation",
        "Surface removal",
        "Changing relief"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_weathering",
      "name": "Weathering in place",
      "prereqs": [],
      "section": "6.2",
      "mechanism": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "example": "Water freezing in a crack can fragment rock. Oxidation can alter iron-bearing minerals. Neither example requires the debris to move downstream.",
      "mistake": "Breaking a rock in place is not the same as carrying its fragments away.",
      "nodes": [
        "Rock at location",
        "Fragment or alter",
        "Material remains"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_erosion",
      "name": "Erosion and its agents",
      "prereqs": [
        "gu_weathering"
      ],
      "section": "6.2",
      "mechanism": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "example": "An intense storm can cut a dry channel in a desert. Strong winds can remove fine loose sediment elsewhere in the same region.",
      "mistake": "A landscape label such as desert does not identify its strongest erosional agent without evidence.",
      "nodes": [
        "Agent and conditions",
        "Detach and remove",
        "Landscape changes"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_transport",
      "name": "Sediment transportation",
      "prereqs": [
        "gu_erosion"
      ],
      "section": "6.3",
      "mechanism": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "example": "Fine silt may remain suspended while larger grains move along the bed. Slower water does not necessarily deposit every particle immediately.",
      "mistake": "Sediment in motion is not deposition, and speed alone does not determine every particle's behaviour.",
      "nodes": [
        "Detached sediment",
        "Moved by flow",
        "Size and capacity"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_deposition",
      "name": "Conditional deposition",
      "prereqs": [
        "gu_transport"
      ],
      "section": "6.3",
      "mechanism": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "example": "A coarse bar can accumulate where flow loses transport capacity. Strong coastal waves may remove enough delivered sediment to limit delta growth.",
      "mistake": "Not every speed decrease deposits every grain, and not every river mouth builds a delta.",
      "nodes": [
        "Sediment delivery",
        "Settling versus removal",
        "Net accumulation"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_landforms",
      "name": "Landforms and their evidence",
      "prereqs": [
        "gu_deposition"
      ],
      "section": "6.3",
      "mechanism": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "example": "A V-shaped valley with active river incision and a U-shaped valley with glacial evidence suggest different dominant shaping histories.",
      "mistake": "Rivers can erode and deposit in several reaches; the upper/middle/lower-course model is a simplification.",
      "nodes": [
        "Agent and material",
        "Process evidence",
        "Landform history"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_slope",
      "name": "Slope failure and mass wasting",
      "prereqs": [
        "gu_weathering"
      ],
      "section": "6.5",
      "mechanism": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "example": "A road cut and intense rain can jointly destabilize a fractured slope. Assessment needs drainage, material strength and exposure evidence.",
      "mistake": "Calling all landslides a result of deforestation ignores water, geology, slope changes and triggers.",
      "nodes": [
        "Gravity and stress",
        "Strength and water",
        "Slope movement"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_agents",
      "name": "Ice, wind, waves and dissolution",
      "prereqs": [
        "gu_erosion"
      ],
      "section": "6.4",
      "mechanism": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "example": "Moraines indicate ice-related deposition; dunes indicate wind transport/deposition; limestone caves may indicate dissolution.",
      "mistake": "A feature's shape alone is insufficient; combine material, setting and process evidence.",
      "nodes": [
        "Agent and setting",
        "Erode or deposit",
        "Diagnostic evidence"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_human",
      "name": "Settlement on changing landforms",
      "prereqs": [
        "gu_landforms"
      ],
      "section": "19",
      "mechanism": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "example": "Two floodplain towns can have different outcomes because housing, warning access and evacuation routes differ despite similar flood depths.",
      "mistake": "Fertile land is not flood-free, and physical geography does not mechanically determine prosperity.",
      "nodes": [
        "Landform opportunities",
        "Exposure and services",
        "Unequal outcomes"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_governance",
      "name": "Basin management and flood risk",
      "prereqs": [
        "gu_human"
      ],
      "section": "12.3",
      "mechanism": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "example": "Protecting one bank with an embankment may alter water levels or exposure elsewhere. Management needs basin-scale evidence and local participation.",
      "mistake": "A protective structure is not proof that all downstream risks or future floods vanish.",
      "nodes": [
        "Hazard and basin",
        "Exposure and capacity",
        "Management trade-offs"
      ],
      "unit": "geomorphology"
    },
    {
      "id": "gu_coordinates",
      "name": "Latitude and longitude",
      "prereqs": [],
      "section": "4.2",
      "mechanism": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "example": "20 degrees north, 70 degrees east identifies a position using two different angular measurements. Two places can share latitude but differ in longitude.",
      "mistake": "Latitude is not distance east of Greenwich, and a single coordinate usually does not uniquely locate a place.",
      "nodes": [
        "Equator and meridian",
        "Two angular coordinates",
        "Locate a position"
      ],
      "unit": "maps_motions"
    },
    {
      "id": "gu_scale",
      "name": "Map scale and distance",
      "prereqs": [
        "gu_coordinates"
      ],
      "section": "4.5",
      "mechanism": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "example": "Two centimetres on a 1:50,000 map represent one kilometre on the ground. Enlarging a digital image requires updating its scale representation.",
      "mistake": "A larger scale does not mean a larger region, and centimetres must be converted before reporting kilometres.",
      "nodes": [
        "Map distance",
        "Multiply by denominator",
        "Convert ground units"
      ],
      "unit": "maps_motions"
    },
    {
      "id": "gu_projection",
      "name": "Map projections and distortion",
      "prereqs": [
        "gu_coordinates"
      ],
      "section": "4.6",
      "mechanism": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "example": "A world map can make high-latitude regions look disproportionately large. An equal-area projection is a better starting point for area comparisons.",
      "mistake": "A familiar world map is not a distortion-free picture of the planet.",
      "nodes": [
        "Curved surface",
        "Chosen projection",
        "Property trade-offs"
      ],
      "unit": "maps_motions"
    },
    {
      "id": "gu_motions",
      "name": "Rotation, revolution and seasons",
      "prereqs": [
        "gu_coordinates"
      ],
      "section": "4.3",
      "mechanism": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "example": "When the Northern Hemisphere tilts toward the Sun, the Southern Hemisphere tilts away. A planet with little tilt can still rotate and have day/night.",
      "mistake": "Summer is not simply the whole planet moving closer to the Sun, and rotation is not revolution.",
      "nodes": [
        "Tilt and orbital position",
        "Solar angle and day length",
        "Seasonal illumination"
      ],
      "unit": "maps_motions"
    },
    {
      "id": "gu_monsoon",
      "name": "Seasonal monsoon circulation",
      "prereqs": [
        "gu_pressure",
        "gu_orographic"
      ],
      "section": "7.7",
      "mechanism": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "example": "A wet spell requires moisture transport and favourable ascent. Regional topography can make rainfall differ within the same seasonal circulation.",
      "mistake": "One heating contrast does not completely explain the timing, intensity and spatial pattern of the monsoon.",
      "nodes": [
        "Seasonal heating and pressure",
        "Circulation and moisture",
        "Relief and rainfall"
      ],
      "unit": "monsoon"
    },
    {
      "id": "gu_variability",
      "name": "Monsoon variability and evidence",
      "prereqs": [
        "gu_monsoon"
      ],
      "section": "7.7",
      "mechanism": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "example": "A seasonal national rainfall summary can conceal regional deficits and short intense events. Event and seasonal evidence answer different questions.",
      "mistake": "An El Niño label does not deterministically fix rainfall at every location, and an annual average does not describe each storm.",
      "nodes": [
        "Climate and weather influences",
        "Probabilities and regional variation",
        "Dated observations"
      ],
      "unit": "monsoon"
    }
  ],
  "atoms": [
    {
      "id": "gu_energy_explanation",
      "conceptId": "gu_energy",
      "kind": "explanation",
      "body": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_energy_example",
      "conceptId": "gu_energy",
      "kind": "example",
      "body": "Dark and bright surfaces can absorb different fractions of the same sunlight. Cloud and atmosphere also modify the energy reaching and leaving the surface.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_energy_common_mistake",
      "conceptId": "gu_energy",
      "kind": "common_mistake",
      "body": "Incoming radiation is not all absorbed, and greenhouse warming is not the same mechanism as an ozone hole.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_energy_hint_l1",
      "conceptId": "gu_energy",
      "kind": "hint_l1",
      "body": "Check this distinction: Incoming radiation is not all absorbed, and greenhouse warming is not the same mechanism as an ozone hole.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_energy_hint_l2",
      "conceptId": "gu_energy",
      "kind": "hint_l2",
      "body": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_energy_hint_l3",
      "conceptId": "gu_energy",
      "kind": "hint_l3",
      "body": "Worked situation: Dark and bright surfaces can absorb different fractions of the same sunlight. Cloud and atmosphere also modify the energy reaching and leaving the surface.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_pressure_explanation",
      "conceptId": "gu_pressure",
      "kind": "explanation",
      "body": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_pressure_example",
      "conceptId": "gu_pressure",
      "kind": "example",
      "body": "Near a coast, different heating of land and sea can help produce a pressure contrast and a breeze. Local circulation also depends on surrounding conditions.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_pressure_common_mistake",
      "conceptId": "gu_pressure",
      "kind": "common_mistake",
      "body": "Wind is not simply a direct movement from every hot place to every cold place.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_pressure_hint_l1",
      "conceptId": "gu_pressure",
      "kind": "hint_l1",
      "body": "Check this distinction: Wind is not simply a direct movement from every hot place to every cold place.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_pressure_hint_l2",
      "conceptId": "gu_pressure",
      "kind": "hint_l2",
      "body": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_pressure_hint_l3",
      "conceptId": "gu_pressure",
      "kind": "hint_l3",
      "body": "Worked situation: Near a coast, different heating of land and sea can help produce a pressure contrast and a breeze. Local circulation also depends on surrounding conditions.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_moisture_explanation",
      "conceptId": "gu_moisture",
      "kind": "explanation",
      "body": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_moisture_example",
      "conceptId": "gu_moisture",
      "kind": "example",
      "body": "Air can reach saturation as it cools without adding water vapour. Dew point describes the cooling needed under approximately constant pressure and moisture content.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_moisture_common_mistake",
      "conceptId": "gu_moisture",
      "kind": "common_mistake",
      "body": "High moisture by itself is not proof that rainfall will occur, and relative humidity is temperature-dependent.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_moisture_hint_l1",
      "conceptId": "gu_moisture",
      "kind": "hint_l1",
      "body": "Check this distinction: High moisture by itself is not proof that rainfall will occur, and relative humidity is temperature-dependent.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_moisture_hint_l2",
      "conceptId": "gu_moisture",
      "kind": "hint_l2",
      "body": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_moisture_hint_l3",
      "conceptId": "gu_moisture",
      "kind": "hint_l3",
      "body": "Worked situation: Air can reach saturation as it cools without adding water vapour. Dew point describes the cooling needed under approximately constant pressure and moisture content.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_orographic_explanation",
      "conceptId": "gu_orographic",
      "kind": "explanation",
      "body": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_orographic_example",
      "conceptId": "gu_orographic",
      "kind": "example",
      "body": "Changing the prevailing moist wind from west to east can change which mountain slope is windward. Rainfall still depends on moisture and atmospheric conditions.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_orographic_common_mistake",
      "conceptId": "gu_orographic",
      "kind": "common_mistake",
      "body": "Altitude alone cannot identify a rain shadow or the wettest slope.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_orographic_hint_l1",
      "conceptId": "gu_orographic",
      "kind": "hint_l1",
      "body": "Check this distinction: Altitude alone cannot identify a rain shadow or the wettest slope.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_orographic_hint_l2",
      "conceptId": "gu_orographic",
      "kind": "hint_l2",
      "body": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_orographic_hint_l3",
      "conceptId": "gu_orographic",
      "kind": "hint_l3",
      "body": "Worked situation: Changing the prevailing moist wind from west to east can change which mountain slope is windward. Rainfall still depends on moisture and atmospheric conditions.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_forces_explanation",
      "conceptId": "gu_forces",
      "kind": "explanation",
      "body": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.1",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_forces_example",
      "conceptId": "gu_forces",
      "kind": "example",
      "body": "A mountain belt can rise through tectonics while rivers incise valleys in it. Uplift and erosion can operate together.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.1",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_forces_common_mistake",
      "conceptId": "gu_forces",
      "kind": "common_mistake",
      "body": "Uplift does not mean erosion stops; surface change is not explained by one force alone.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.1",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_forces_hint_l1",
      "conceptId": "gu_forces",
      "kind": "hint_l1",
      "body": "Check this distinction: Uplift does not mean erosion stops; surface change is not explained by one force alone.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.1",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_forces_hint_l2",
      "conceptId": "gu_forces",
      "kind": "hint_l2",
      "body": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.1",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_forces_hint_l3",
      "conceptId": "gu_forces",
      "kind": "hint_l3",
      "body": "Worked situation: A mountain belt can rise through tectonics while rivers incise valleys in it. Uplift and erosion can operate together.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.1",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_weathering_explanation",
      "conceptId": "gu_weathering",
      "kind": "explanation",
      "body": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_weathering_example",
      "conceptId": "gu_weathering",
      "kind": "example",
      "body": "Water freezing in a crack can fragment rock. Oxidation can alter iron-bearing minerals. Neither example requires the debris to move downstream.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_weathering_common_mistake",
      "conceptId": "gu_weathering",
      "kind": "common_mistake",
      "body": "Breaking a rock in place is not the same as carrying its fragments away.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_weathering_hint_l1",
      "conceptId": "gu_weathering",
      "kind": "hint_l1",
      "body": "Check this distinction: Breaking a rock in place is not the same as carrying its fragments away.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_weathering_hint_l2",
      "conceptId": "gu_weathering",
      "kind": "hint_l2",
      "body": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_weathering_hint_l3",
      "conceptId": "gu_weathering",
      "kind": "hint_l3",
      "body": "Worked situation: Water freezing in a crack can fragment rock. Oxidation can alter iron-bearing minerals. Neither example requires the debris to move downstream.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_erosion_explanation",
      "conceptId": "gu_erosion",
      "kind": "explanation",
      "body": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_erosion_example",
      "conceptId": "gu_erosion",
      "kind": "example",
      "body": "An intense storm can cut a dry channel in a desert. Strong winds can remove fine loose sediment elsewhere in the same region.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_erosion_common_mistake",
      "conceptId": "gu_erosion",
      "kind": "common_mistake",
      "body": "A landscape label such as desert does not identify its strongest erosional agent without evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_erosion_hint_l1",
      "conceptId": "gu_erosion",
      "kind": "hint_l1",
      "body": "Check this distinction: A landscape label such as desert does not identify its strongest erosional agent without evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_erosion_hint_l2",
      "conceptId": "gu_erosion",
      "kind": "hint_l2",
      "body": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_erosion_hint_l3",
      "conceptId": "gu_erosion",
      "kind": "hint_l3",
      "body": "Worked situation: An intense storm can cut a dry channel in a desert. Strong winds can remove fine loose sediment elsewhere in the same region.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_transport_explanation",
      "conceptId": "gu_transport",
      "kind": "explanation",
      "body": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_transport_example",
      "conceptId": "gu_transport",
      "kind": "example",
      "body": "Fine silt may remain suspended while larger grains move along the bed. Slower water does not necessarily deposit every particle immediately.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_transport_common_mistake",
      "conceptId": "gu_transport",
      "kind": "common_mistake",
      "body": "Sediment in motion is not deposition, and speed alone does not determine every particle's behaviour.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_transport_hint_l1",
      "conceptId": "gu_transport",
      "kind": "hint_l1",
      "body": "Check this distinction: Sediment in motion is not deposition, and speed alone does not determine every particle's behaviour.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_transport_hint_l2",
      "conceptId": "gu_transport",
      "kind": "hint_l2",
      "body": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_transport_hint_l3",
      "conceptId": "gu_transport",
      "kind": "hint_l3",
      "body": "Worked situation: Fine silt may remain suspended while larger grains move along the bed. Slower water does not necessarily deposit every particle immediately.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_deposition_explanation",
      "conceptId": "gu_deposition",
      "kind": "explanation",
      "body": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_deposition_example",
      "conceptId": "gu_deposition",
      "kind": "example",
      "body": "A coarse bar can accumulate where flow loses transport capacity. Strong coastal waves may remove enough delivered sediment to limit delta growth.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_deposition_common_mistake",
      "conceptId": "gu_deposition",
      "kind": "common_mistake",
      "body": "Not every speed decrease deposits every grain, and not every river mouth builds a delta.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_deposition_hint_l1",
      "conceptId": "gu_deposition",
      "kind": "hint_l1",
      "body": "Check this distinction: Not every speed decrease deposits every grain, and not every river mouth builds a delta.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_deposition_hint_l2",
      "conceptId": "gu_deposition",
      "kind": "hint_l2",
      "body": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_deposition_hint_l3",
      "conceptId": "gu_deposition",
      "kind": "hint_l3",
      "body": "Worked situation: A coarse bar can accumulate where flow loses transport capacity. Strong coastal waves may remove enough delivered sediment to limit delta growth.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_landforms_explanation",
      "conceptId": "gu_landforms",
      "kind": "explanation",
      "body": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_landforms_example",
      "conceptId": "gu_landforms",
      "kind": "example",
      "body": "A V-shaped valley with active river incision and a U-shaped valley with glacial evidence suggest different dominant shaping histories.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_landforms_common_mistake",
      "conceptId": "gu_landforms",
      "kind": "common_mistake",
      "body": "Rivers can erode and deposit in several reaches; the upper/middle/lower-course model is a simplification.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_landforms_hint_l1",
      "conceptId": "gu_landforms",
      "kind": "hint_l1",
      "body": "Check this distinction: Rivers can erode and deposit in several reaches; the upper/middle/lower-course model is a simplification.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_landforms_hint_l2",
      "conceptId": "gu_landforms",
      "kind": "hint_l2",
      "body": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_landforms_hint_l3",
      "conceptId": "gu_landforms",
      "kind": "hint_l3",
      "body": "Worked situation: A V-shaped valley with active river incision and a U-shaped valley with glacial evidence suggest different dominant shaping histories.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_slope_explanation",
      "conceptId": "gu_slope",
      "kind": "explanation",
      "body": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_slope_example",
      "conceptId": "gu_slope",
      "kind": "example",
      "body": "A road cut and intense rain can jointly destabilize a fractured slope. Assessment needs drainage, material strength and exposure evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_slope_common_mistake",
      "conceptId": "gu_slope",
      "kind": "common_mistake",
      "body": "Calling all landslides a result of deforestation ignores water, geology, slope changes and triggers.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_slope_hint_l1",
      "conceptId": "gu_slope",
      "kind": "hint_l1",
      "body": "Check this distinction: Calling all landslides a result of deforestation ignores water, geology, slope changes and triggers.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_slope_hint_l2",
      "conceptId": "gu_slope",
      "kind": "hint_l2",
      "body": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_slope_hint_l3",
      "conceptId": "gu_slope",
      "kind": "hint_l3",
      "body": "Worked situation: A road cut and intense rain can jointly destabilize a fractured slope. Assessment needs drainage, material strength and exposure evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_agents_explanation",
      "conceptId": "gu_agents",
      "kind": "explanation",
      "body": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_agents_example",
      "conceptId": "gu_agents",
      "kind": "example",
      "body": "Moraines indicate ice-related deposition; dunes indicate wind transport/deposition; limestone caves may indicate dissolution.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_agents_common_mistake",
      "conceptId": "gu_agents",
      "kind": "common_mistake",
      "body": "A feature's shape alone is insufficient; combine material, setting and process evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_agents_hint_l1",
      "conceptId": "gu_agents",
      "kind": "hint_l1",
      "body": "Check this distinction: A feature's shape alone is insufficient; combine material, setting and process evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_agents_hint_l2",
      "conceptId": "gu_agents",
      "kind": "hint_l2",
      "body": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_agents_hint_l3",
      "conceptId": "gu_agents",
      "kind": "hint_l3",
      "body": "Worked situation: Moraines indicate ice-related deposition; dunes indicate wind transport/deposition; limestone caves may indicate dissolution.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §6.4",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_human_explanation",
      "conceptId": "gu_human",
      "kind": "explanation",
      "body": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §19",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_human_example",
      "conceptId": "gu_human",
      "kind": "example",
      "body": "Two floodplain towns can have different outcomes because housing, warning access and evacuation routes differ despite similar flood depths.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §19",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_human_common_mistake",
      "conceptId": "gu_human",
      "kind": "common_mistake",
      "body": "Fertile land is not flood-free, and physical geography does not mechanically determine prosperity.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §19",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_human_hint_l1",
      "conceptId": "gu_human",
      "kind": "hint_l1",
      "body": "Check this distinction: Fertile land is not flood-free, and physical geography does not mechanically determine prosperity.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §19",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_human_hint_l2",
      "conceptId": "gu_human",
      "kind": "hint_l2",
      "body": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §19",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_human_hint_l3",
      "conceptId": "gu_human",
      "kind": "hint_l3",
      "body": "Worked situation: Two floodplain towns can have different outcomes because housing, warning access and evacuation routes differ despite similar flood depths.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §19",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_governance_explanation",
      "conceptId": "gu_governance",
      "kind": "explanation",
      "body": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §12.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_governance_example",
      "conceptId": "gu_governance",
      "kind": "example",
      "body": "Protecting one bank with an embankment may alter water levels or exposure elsewhere. Management needs basin-scale evidence and local participation.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §12.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_governance_common_mistake",
      "conceptId": "gu_governance",
      "kind": "common_mistake",
      "body": "A protective structure is not proof that all downstream risks or future floods vanish.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §12.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_governance_hint_l1",
      "conceptId": "gu_governance",
      "kind": "hint_l1",
      "body": "Check this distinction: A protective structure is not proof that all downstream risks or future floods vanish.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §12.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_governance_hint_l2",
      "conceptId": "gu_governance",
      "kind": "hint_l2",
      "body": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §12.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_governance_hint_l3",
      "conceptId": "gu_governance",
      "kind": "hint_l3",
      "body": "Worked situation: Protecting one bank with an embankment may alter water levels or exposure elsewhere. Management needs basin-scale evidence and local participation.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §12.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_coordinates_explanation",
      "conceptId": "gu_coordinates",
      "kind": "explanation",
      "body": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_coordinates_example",
      "conceptId": "gu_coordinates",
      "kind": "example",
      "body": "20 degrees north, 70 degrees east identifies a position using two different angular measurements. Two places can share latitude but differ in longitude.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_coordinates_common_mistake",
      "conceptId": "gu_coordinates",
      "kind": "common_mistake",
      "body": "Latitude is not distance east of Greenwich, and a single coordinate usually does not uniquely locate a place.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_coordinates_hint_l1",
      "conceptId": "gu_coordinates",
      "kind": "hint_l1",
      "body": "Check this distinction: Latitude is not distance east of Greenwich, and a single coordinate usually does not uniquely locate a place.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_coordinates_hint_l2",
      "conceptId": "gu_coordinates",
      "kind": "hint_l2",
      "body": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_coordinates_hint_l3",
      "conceptId": "gu_coordinates",
      "kind": "hint_l3",
      "body": "Worked situation: 20 degrees north, 70 degrees east identifies a position using two different angular measurements. Two places can share latitude but differ in longitude.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.2",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_scale_explanation",
      "conceptId": "gu_scale",
      "kind": "explanation",
      "body": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_scale_example",
      "conceptId": "gu_scale",
      "kind": "example",
      "body": "Two centimetres on a 1:50,000 map represent one kilometre on the ground. Enlarging a digital image requires updating its scale representation.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_scale_common_mistake",
      "conceptId": "gu_scale",
      "kind": "common_mistake",
      "body": "A larger scale does not mean a larger region, and centimetres must be converted before reporting kilometres.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_scale_hint_l1",
      "conceptId": "gu_scale",
      "kind": "hint_l1",
      "body": "Check this distinction: A larger scale does not mean a larger region, and centimetres must be converted before reporting kilometres.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_scale_hint_l2",
      "conceptId": "gu_scale",
      "kind": "hint_l2",
      "body": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_scale_hint_l3",
      "conceptId": "gu_scale",
      "kind": "hint_l3",
      "body": "Worked situation: Two centimetres on a 1:50,000 map represent one kilometre on the ground. Enlarging a digital image requires updating its scale representation.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.5",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_projection_explanation",
      "conceptId": "gu_projection",
      "kind": "explanation",
      "body": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.6",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_projection_example",
      "conceptId": "gu_projection",
      "kind": "example",
      "body": "A world map can make high-latitude regions look disproportionately large. An equal-area projection is a better starting point for area comparisons.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.6",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_projection_common_mistake",
      "conceptId": "gu_projection",
      "kind": "common_mistake",
      "body": "A familiar world map is not a distortion-free picture of the planet.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.6",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_projection_hint_l1",
      "conceptId": "gu_projection",
      "kind": "hint_l1",
      "body": "Check this distinction: A familiar world map is not a distortion-free picture of the planet.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.6",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_projection_hint_l2",
      "conceptId": "gu_projection",
      "kind": "hint_l2",
      "body": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.6",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_projection_hint_l3",
      "conceptId": "gu_projection",
      "kind": "hint_l3",
      "body": "Worked situation: A world map can make high-latitude regions look disproportionately large. An equal-area projection is a better starting point for area comparisons.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.6",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_motions_explanation",
      "conceptId": "gu_motions",
      "kind": "explanation",
      "body": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_motions_example",
      "conceptId": "gu_motions",
      "kind": "example",
      "body": "When the Northern Hemisphere tilts toward the Sun, the Southern Hemisphere tilts away. A planet with little tilt can still rotate and have day/night.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_motions_common_mistake",
      "conceptId": "gu_motions",
      "kind": "common_mistake",
      "body": "Summer is not simply the whole planet moving closer to the Sun, and rotation is not revolution.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_motions_hint_l1",
      "conceptId": "gu_motions",
      "kind": "hint_l1",
      "body": "Check this distinction: Summer is not simply the whole planet moving closer to the Sun, and rotation is not revolution.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_motions_hint_l2",
      "conceptId": "gu_motions",
      "kind": "hint_l2",
      "body": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_motions_hint_l3",
      "conceptId": "gu_motions",
      "kind": "hint_l3",
      "body": "Worked situation: When the Northern Hemisphere tilts toward the Sun, the Southern Hemisphere tilts away. A planet with little tilt can still rotate and have day/night.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §4.3",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_monsoon_explanation",
      "conceptId": "gu_monsoon",
      "kind": "explanation",
      "body": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_monsoon_example",
      "conceptId": "gu_monsoon",
      "kind": "example",
      "body": "A wet spell requires moisture transport and favourable ascent. Regional topography can make rainfall differ within the same seasonal circulation.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_monsoon_common_mistake",
      "conceptId": "gu_monsoon",
      "kind": "common_mistake",
      "body": "One heating contrast does not completely explain the timing, intensity and spatial pattern of the monsoon.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_monsoon_hint_l1",
      "conceptId": "gu_monsoon",
      "kind": "hint_l1",
      "body": "Check this distinction: One heating contrast does not completely explain the timing, intensity and spatial pattern of the monsoon.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_monsoon_hint_l2",
      "conceptId": "gu_monsoon",
      "kind": "hint_l2",
      "body": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_monsoon_hint_l3",
      "conceptId": "gu_monsoon",
      "kind": "hint_l3",
      "body": "Worked situation: A wet spell requires moisture transport and favourable ascent. Regional topography can make rainfall differ within the same seasonal circulation.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_variability_explanation",
      "conceptId": "gu_variability",
      "kind": "explanation",
      "body": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_variability_example",
      "conceptId": "gu_variability",
      "kind": "example",
      "body": "A seasonal national rainfall summary can conceal regional deficits and short intense events. Event and seasonal evidence answer different questions.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_variability_common_mistake",
      "conceptId": "gu_variability",
      "kind": "common_mistake",
      "body": "An El Niño label does not deterministically fix rainfall at every location, and an annual average does not describe each storm.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_variability_hint_l1",
      "conceptId": "gu_variability",
      "kind": "hint_l1",
      "body": "Check this distinction: An El Niño label does not deterministically fix rainfall at every location, and an annual average does not describe each storm.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_variability_hint_l2",
      "conceptId": "gu_variability",
      "kind": "hint_l2",
      "body": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    },
    {
      "id": "gu_variability_hint_l3",
      "conceptId": "gu_variability",
      "kind": "hint_l3",
      "body": "Worked situation: A seasonal national rainfall summary can conceal regional deficits and short intense events. Event and seasonal evidence answer different questions.",
      "lang": "en",
      "version": 1,
      "source": "Geography master §7.7",
      "verifiedBy": "Original unit authoring · subject review pending",
      "riskLevel": "fact"
    }
  ],
  "items": [
    {
      "id": "gu_energy_diagnostic",
      "conceptId": "gu_energy",
      "purpose": "diagnostic",
      "stem": "Insolation means—",
      "options": [
        "Only wind speed",
        "Only groundwater flow",
        "Incoming solar radiation",
        "Only outgoing heat"
      ],
      "answer": 2,
      "rationale": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_energy_practice",
      "conceptId": "gu_energy",
      "purpose": "practice",
      "stem": "If reflectivity increases while incoming sunlight is unchanged, what generally happens to absorbed sunlight?",
      "options": [
        "It must increase",
        "It is always unchanged",
        "It becomes groundwater",
        "It decreases"
      ],
      "answer": 3,
      "rationale": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_energy_check",
      "conceptId": "gu_energy",
      "purpose": "check",
      "stem": "What does albedo describe?",
      "options": [
        "Fraction of incoming radiation reflected",
        "Only air pressure",
        "Only humidity",
        "Only orbital speed"
      ],
      "answer": 0,
      "rationale": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_energy_transfer",
      "conceptId": "gu_energy",
      "purpose": "transfer",
      "stem": "Two roofs receive similar sunlight; one reflects a larger fraction. What can be inferred before considering other heat flows?",
      "options": [
        "It must have identical temperature at every moment",
        "It has removed the greenhouse effect",
        "It cannot emit radiation",
        "It absorbs less of that incoming radiation"
      ],
      "answer": 3,
      "rationale": "Insolation is incoming solar radiation. Solar angle, day length, clouds and surface reflectivity affect absorbed energy. Earth reflects some incoming energy and emits longwave radiation; radiation, convection and latent heat help redistribute energy. The greenhouse effect is distinct from ozone depletion.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_pressure_diagnostic",
      "conceptId": "gu_pressure",
      "purpose": "diagnostic",
      "stem": "Which force initiates air motion in response to a pressure difference?",
      "options": [
        "Only tidal force",
        "Only map distortion",
        "Only sediment weight",
        "Pressure-gradient force"
      ],
      "answer": 3,
      "rationale": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_pressure_practice",
      "conceptId": "gu_pressure",
      "purpose": "practice",
      "stem": "What modifies a wind driven by a pressure gradient?",
      "options": [
        "Only population size",
        "Only the river's sediment",
        "Rotation and friction, among other influences",
        "Only textbook colour"
      ],
      "answer": 2,
      "rationale": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_pressure_check",
      "conceptId": "gu_pressure",
      "purpose": "check",
      "stem": "Why is a temperature-only wind explanation incomplete?",
      "options": [
        "All winds are identical",
        "Earth has no rotation",
        "Pressure structure and other forces affect air motion",
        "Temperature can never influence pressure"
      ],
      "answer": 2,
      "rationale": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_pressure_transfer",
      "conceptId": "gu_pressure",
      "purpose": "transfer",
      "stem": "A coastal breeze differs between an open plain and a rough built-up coast. Which additional influence should be considered?",
      "options": [
        "Only the name of the town",
        "Friction and local terrain/surfaces",
        "Only longitude labels",
        "Only whether the map is flat"
      ],
      "answer": 1,
      "rationale": "Air motion responds to pressure-gradient force and is modified by Earth's rotation, friction and curvature. Unequal heating can help create pressure differences, but winds are not explained by temperature alone. Circulation changes with scale, terrain and season.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_moisture_diagnostic",
      "conceptId": "gu_moisture",
      "purpose": "diagnostic",
      "stem": "Relative humidity is evaluated against saturation at—",
      "options": [
        "Any unrelated temperature",
        "Only sea level always",
        "Only the previous year",
        "The same temperature"
      ],
      "answer": 3,
      "rationale": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_moisture_practice",
      "conceptId": "gu_moisture",
      "purpose": "practice",
      "stem": "Without adding vapour, what can bring air nearer saturation?",
      "options": [
        "Adding sediment to a river",
        "Increasing road width",
        "Cooling under suitable conditions",
        "Changing the map legend"
      ],
      "answer": 2,
      "rationale": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_moisture_check",
      "conceptId": "gu_moisture",
      "purpose": "check",
      "stem": "Does moisture alone guarantee precipitation?",
      "options": [
        "No, moisture is irrelevant to clouds",
        "No; lifting, stability and cloud processes matter",
        "Yes, every humid day must rain",
        "Yes, regardless of temperature"
      ],
      "answer": 1,
      "rationale": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_moisture_transfer",
      "conceptId": "gu_moisture",
      "purpose": "transfer",
      "stem": "Two equally moist air masses have different temperatures and stability. Must their rain outcomes match?",
      "options": [
        "Yes; water amount is the only factor",
        "Yes; temperature cannot affect saturation",
        "No; neither can form clouds",
        "No; saturation and lifting conditions may differ"
      ],
      "answer": 3,
      "rationale": "Relative humidity compares actual vapour pressure with saturation vapour pressure at the same temperature. Cooling can bring moist air to saturation. Clouds require suitable condensation or ice processes; precipitation also depends on lifting, stability and microphysics. Moisture alone does not guarantee rain.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_orographic_diagnostic",
      "conceptId": "gu_orographic",
      "purpose": "diagnostic",
      "stem": "What starts orographic ascent?",
      "options": [
        "Water flowing underground only",
        "A map becoming larger",
        "Air forced upward by relief",
        "Every mountain changing latitude"
      ],
      "answer": 2,
      "rationale": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_orographic_practice",
      "conceptId": "gu_orographic",
      "purpose": "practice",
      "stem": "Which slope faces the incoming moist wind?",
      "options": [
        "Always the leeward slope",
        "The windward slope",
        "Always the eastern slope",
        "Always the highest point"
      ],
      "answer": 1,
      "rationale": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_orographic_check",
      "conceptId": "gu_orographic",
      "purpose": "check",
      "stem": "Why can leeward air become relatively drier?",
      "options": [
        "Wind direction never changes",
        "Descending air warms, lowering relative humidity under suitable conditions",
        "Gravity removes all water instantly",
        "Every cloud is blocked permanently"
      ],
      "answer": 1,
      "rationale": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_orographic_transfer",
      "conceptId": "gu_orographic",
      "purpose": "transfer",
      "stem": "Moist prevailing wind reverses across a mountain range. What should you reconsider?",
      "options": [
        "Whether all rainfall stops forever",
        "Whether latitude and longitude swap",
        "Which slope is windward, along with moisture and stability",
        "Only the mountain's name"
      ],
      "answer": 2,
      "rationale": "Moist air encountering relief can rise, expand and cool toward saturation. Windward precipitation may increase; descending leeward air often warms and has lower relative humidity. Wind direction, moisture, stability and terrain control the effect; highest elevation is not automatically wettest.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_forces_diagnostic",
      "conceptId": "gu_forces",
      "purpose": "diagnostic",
      "stem": "Which process is primarily endogenic?",
      "options": [
        "Fault movement",
        "Sediment settling",
        "Wind moving sand",
        "Rainwater dissolving limestone"
      ],
      "answer": 0,
      "rationale": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_forces_practice",
      "conceptId": "gu_forces",
      "purpose": "practice",
      "stem": "A rising mountain is also cut by rivers. Which explanation fits?",
      "options": [
        "Only erosion can occur",
        "Only uplift can occur",
        "The mantle must be fully liquid",
        "Internal and surface processes interact"
      ],
      "answer": 3,
      "rationale": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_forces_check",
      "conceptId": "gu_forces",
      "purpose": "check",
      "stem": "Which energy source chiefly supports tectonic activity?",
      "options": [
        "Earth's internal energy",
        "Moonlight",
        "River evaporation",
        "Traffic friction"
      ],
      "answer": 0,
      "rationale": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_forces_transfer",
      "conceptId": "gu_forces",
      "purpose": "transfer",
      "stem": "Two mountain belts have similar uplift but different rainfall and rocks. Must their valleys develop identically?",
      "options": [
        "Yes; rock type never matters",
        "No; tectonics cannot create mountains",
        "No; surface conditions and resistance also matter",
        "Yes; uplift fixes every landform"
      ],
      "answer": 2,
      "rationale": "Internal heat and plate motion can deform Earth's crust. Solar energy and gravity power many surface processes. Landforms reflect their interaction with rock, climate and time; the mantle is not a fully liquid ocean.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_weathering_diagnostic",
      "conceptId": "gu_weathering",
      "purpose": "diagnostic",
      "stem": "A rock cracks while remaining where it formed. This is—",
      "options": [
        "Plate convergence",
        "Weathering",
        "Transportation",
        "River deposition"
      ],
      "answer": 1,
      "rationale": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_weathering_practice",
      "conceptId": "gu_weathering",
      "purpose": "practice",
      "stem": "Iron-bearing minerals oxidize in a stationary rock. Which description fits?",
      "options": [
        "Glacial deposition",
        "Chemical weathering",
        "River transport",
        "Delta formation"
      ],
      "answer": 1,
      "rationale": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_weathering_check",
      "conceptId": "gu_weathering",
      "purpose": "check",
      "stem": "What separates weathering from removal by an agent?",
      "options": [
        "Weathering requires transport",
        "Weathering only occurs underwater",
        "Weathering cannot change minerals",
        "Weathering occurs in place"
      ],
      "answer": 3,
      "rationale": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_weathering_transfer",
      "conceptId": "gu_weathering",
      "purpose": "transfer",
      "stem": "Roots widen a crack in a hillside rock; fragments remain beside it. Which evidence would establish subsequent erosion?",
      "options": [
        "The rock has a different colour",
        "The hillside receives sunlight",
        "An agent detaches and removes fragments",
        "The roots keep growing"
      ],
      "answer": 2,
      "rationale": "Weathering breaks down or alters rock at its location. Physical weathering fragments it; chemical weathering changes minerals. Root action and organisms can contribute. Removal and transport are separate processes.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_erosion_diagnostic",
      "conceptId": "gu_erosion",
      "purpose": "diagnostic",
      "stem": "Which observation demonstrates erosion?",
      "options": [
        "A rock remains intact",
        "Flowing water removes bank material",
        "A stationary mineral oxidizes",
        "Sediment settles in a lake"
      ],
      "answer": 1,
      "rationale": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_erosion_practice",
      "conceptId": "gu_erosion",
      "purpose": "practice",
      "stem": "A desert channel deepens during a rainstorm. Which agent is directly evidenced?",
      "options": [
        "Glacial ice",
        "Ocean waves",
        "Running water",
        "Wind simply because it is a desert"
      ],
      "answer": 2,
      "rationale": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_erosion_check",
      "conceptId": "gu_erosion",
      "purpose": "check",
      "stem": "What information best supports identifying the main erosional agent?",
      "options": [
        "The colour of a textbook map",
        "The learner's confidence alone",
        "Observed process and local conditions",
        "The landscape's name alone"
      ],
      "answer": 2,
      "rationale": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_erosion_transfer",
      "conceptId": "gu_erosion",
      "purpose": "transfer",
      "stem": "A dry basin has storm-cut gullies and wind-shaped dunes. What conclusion is justified?",
      "options": [
        "Erosion is impossible in dry places",
        "Different agents shape different features",
        "Only wind has acted",
        "Only water has acted"
      ],
      "answer": 1,
      "rationale": "Erosion detaches and removes material through agents such as flowing water, ice, wind or waves. Their importance depends on climate, event intensity, geology and exposure. A desert can experience substantial episodic water erosion; wind is not automatically dominant everywhere.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_transport_diagnostic",
      "conceptId": "gu_transport",
      "purpose": "diagnostic",
      "stem": "Silt moving downstream in suspension is—",
      "options": [
        "Transportation",
        "Deposition",
        "Folding",
        "In-place weathering"
      ],
      "answer": 0,
      "rationale": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_transport_practice",
      "conceptId": "gu_transport",
      "purpose": "practice",
      "stem": "Which pair helps explain whether a river can move a grain?",
      "options": [
        "Only the river's name",
        "Only the calendar month",
        "Only population density",
        "Flow conditions and particle size"
      ],
      "answer": 3,
      "rationale": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_transport_check",
      "conceptId": "gu_transport",
      "purpose": "check",
      "stem": "Which statement distinguishes transport from deposition?",
      "options": [
        "Both require stationary material",
        "Transport creates tectonic faults",
        "Deposition is movement upstream",
        "Transport moves material; deposition accumulates it"
      ],
      "answer": 3,
      "rationale": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_transport_transfer",
      "conceptId": "gu_transport",
      "purpose": "transfer",
      "stem": "A flow weakens; fine silt remains suspended while coarse grains settle. Is this possible?",
      "options": [
        "No; fine silt is always bed load",
        "Yes; gravity has stopped acting",
        "Yes; particles have different settling and transport requirements",
        "No; every grain must settle at once"
      ],
      "answer": 2,
      "rationale": "Transportation is the movement of sediment after detachment. Rivers can carry dissolved material, suspended particles and bed load. Flow conditions, particle size, sediment supply and channel geometry affect what can be moved.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_deposition_diagnostic",
      "conceptId": "gu_deposition",
      "purpose": "diagnostic",
      "stem": "Sediment settling and accumulating on a river bar is—",
      "options": [
        "Weathering in place",
        "Plate divergence",
        "Evaporation",
        "Deposition"
      ],
      "answer": 3,
      "rationale": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_deposition_practice",
      "conceptId": "gu_deposition",
      "purpose": "practice",
      "stem": "A river delivers sediment but waves remove most of it. What can this limit?",
      "options": [
        "Delta accumulation",
        "Earth's rotation",
        "Chemical composition of all rocks",
        "All rainfall upstream"
      ],
      "answer": 0,
      "rationale": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_deposition_check",
      "conceptId": "gu_deposition",
      "purpose": "check",
      "stem": "Which statement about deposition is best?",
      "options": [
        "Every grain settles whenever speed falls",
        "It occurs only at river mouths",
        "It requires tectonic collision",
        "It depends on particle and flow/environment conditions"
      ],
      "answer": 3,
      "rationale": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_deposition_transfer",
      "conceptId": "gu_deposition",
      "purpose": "transfer",
      "stem": "Two river mouths receive similar loads, but one coast removes sediment much faster. Which outcome is plausible?",
      "options": [
        "The faster-removal coast must accumulate more",
        "Different rates of delta growth",
        "Identical deltas are inevitable",
        "Neither can receive sediment"
      ],
      "answer": 1,
      "rationale": "Deposition is settling or accumulation of transported material when conditions favour it. Changes in transport capacity, particle size and the receiving environment matter. A river mouth forms a delta only when sediment accumulation can outpace removal.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_landforms_diagnostic",
      "conceptId": "gu_landforms",
      "purpose": "diagnostic",
      "stem": "Repeated overbank sediment accumulation helps build—",
      "options": [
        "A solar eclipse",
        "A floodplain",
        "A plate boundary",
        "Earth's axis"
      ],
      "answer": 1,
      "rationale": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_landforms_practice",
      "conceptId": "gu_landforms",
      "purpose": "practice",
      "stem": "A point bar is accumulating beside a migrating channel. Which process is evidenced there?",
      "options": [
        "Deposition",
        "Only crustal folding",
        "Only evaporation",
        "Only in-place oxidation"
      ],
      "answer": 0,
      "rationale": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_landforms_check",
      "conceptId": "gu_landforms",
      "purpose": "check",
      "stem": "Why should landform interpretation consider several agents?",
      "options": [
        "Similar forms can have different histories and conditions",
        "Every landform has one universal cause",
        "Rock resistance never matters",
        "Climate cannot influence surface change"
      ],
      "answer": 0,
      "rationale": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_landforms_transfer",
      "conceptId": "gu_landforms",
      "purpose": "transfer",
      "stem": "A valley has a broad U-shaped cross-section and moraines. Which evidence-based explanation should be investigated?",
      "options": [
        "Past glacial shaping",
        "River incision solely because a stream now exists",
        "Wind erosion solely because it is wide",
        "Plate folding solely because it is deep"
      ],
      "answer": 0,
      "rationale": "River incision can create valleys; lateral channel movement and deposition can produce floodplains, bars and meanders. Glaciers, wind, waves and dissolution also create landforms. Identify the mechanism from feature evidence rather than assuming every shape has one origin.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_slope_diagnostic",
      "conceptId": "gu_slope",
      "purpose": "diagnostic",
      "stem": "Downslope movement driven mainly by gravity is—",
      "options": [
        "Earth revolution",
        "Map projection",
        "Mass wasting",
        "Ocean circulation"
      ],
      "answer": 2,
      "rationale": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_slope_practice",
      "conceptId": "gu_slope",
      "purpose": "practice",
      "stem": "Rain raises pore-water pressure in a weak slope. What should be assessed?",
      "options": [
        "Whether longitude changes",
        "Whether resisting strength is reduced relative to stress",
        "Whether gravity disappears",
        "Whether all rocks become lava"
      ],
      "answer": 1,
      "rationale": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_slope_check",
      "conceptId": "gu_slope",
      "purpose": "check",
      "stem": "Which landslide explanation is adequately conditional?",
      "options": [
        "Deforestation explains every event",
        "Rain always causes every slope to fail",
        "Earthquakes are the only cause",
        "Geology, slope, water and triggers interact"
      ],
      "answer": 3,
      "rationale": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_slope_transfer",
      "conceptId": "gu_slope",
      "purpose": "transfer",
      "stem": "A vegetated slope fails after excavation and heavy rain. What is the best investigation?",
      "options": [
        "Combined changes in geometry, drainage and strength",
        "Assume vegetation guaranteed stability",
        "Ignore excavation because trees remain",
        "Infer plate collision without evidence"
      ],
      "answer": 0,
      "rationale": "Mass wasting moves material downslope under gravity. Failure occurs when driving stress exceeds resisting strength. Water can raise pore pressure; slope cuts, geology, vegetation and earthquakes can alter stability. No single factor explains every landslide.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_agents_diagnostic",
      "conceptId": "gu_agents",
      "purpose": "diagnostic",
      "stem": "A moraine is most closely associated with—",
      "options": [
        "Map scale conversion",
        "Atmospheric pressure gradients",
        "Glacial sediment deposition",
        "Solar heating directly"
      ],
      "answer": 2,
      "rationale": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_agents_practice",
      "conceptId": "gu_agents",
      "purpose": "practice",
      "stem": "A limestone cave develops where water dissolves rock. Which process fits?",
      "options": [
        "Karst dissolution",
        "Plate rotation",
        "Wind deposition only",
        "Glacial freezing only"
      ],
      "answer": 0,
      "rationale": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_agents_check",
      "conceptId": "gu_agents",
      "purpose": "check",
      "stem": "What affects dune development?",
      "options": [
        "Only earthquake magnitude",
        "Wind regime, sand supply and vegetation",
        "Only latitude",
        "Only the coastline's legal status"
      ],
      "answer": 1,
      "rationale": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_agents_transfer",
      "conceptId": "gu_agents",
      "purpose": "transfer",
      "stem": "A sheltered coast gains sand while an exposed cliff retreats. What can explain the contrast?",
      "options": [
        "Coastal change cannot involve deposition",
        "Only the country's population matters",
        "Different wave energy, sediment supply and rock conditions",
        "All coasts must change identically"
      ],
      "answer": 2,
      "rationale": "Glaciers erode and deposit as ice moves. Wind can remove and deposit loose sediment. Waves and coastal currents reshape shores. Dissolution of suitable rock under appropriate water chemistry can form karst. Each mechanism has conditions and characteristic evidence.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_human_diagnostic",
      "conceptId": "gu_human",
      "purpose": "diagnostic",
      "stem": "Why can floodplains attract settlement despite risk?",
      "options": [
        "All floodplains are earthquake-free",
        "Deposition prevents future floods",
        "Fertile land and access can offer benefits alongside hazards",
        "Rivers never flood there"
      ],
      "answer": 2,
      "rationale": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_human_practice",
      "conceptId": "gu_human",
      "purpose": "practice",
      "stem": "What should a floodplain building decision examine?",
      "options": [
        "Only today's weather",
        "Only soil colour",
        "Only the number of shops",
        "Flood history, drainage, exposure and vulnerability"
      ],
      "answer": 3,
      "rationale": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_human_check",
      "conceptId": "gu_human",
      "purpose": "check",
      "stem": "Does similar relief guarantee similar settlement outcomes?",
      "options": [
        "Yes; climate controls every social outcome",
        "No; landforms never influence life",
        "No; institutions and access also matter",
        "Yes; human decisions have no effect"
      ],
      "answer": 2,
      "rationale": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_human_transfer",
      "conceptId": "gu_human",
      "purpose": "transfer",
      "stem": "Two towns face similar flood depths but different warning and evacuation access. Must losses be identical?",
      "options": [
        "Yes; hazard depth is the only factor",
        "Yes; settlement size never matters",
        "No; warning changes Earth's gravity",
        "No; capacity and vulnerability affect outcomes"
      ],
      "answer": 3,
      "rationale": "Landforms influence access, agriculture, drainage and settlement, but livelihoods, infrastructure and institutions also matter. Fertile floodplains can attract settlement while remaining exposed to flooding and channel migration.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_governance_diagnostic",
      "conceptId": "gu_governance",
      "purpose": "diagnostic",
      "stem": "Flood disaster risk depends on—",
      "options": [
        "Rainfall alone in every case",
        "Only the river's length",
        "Only the colour of sediment",
        "Hazard, exposure, vulnerability and capacity"
      ],
      "answer": 3,
      "rationale": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_governance_practice",
      "conceptId": "gu_governance",
      "purpose": "practice",
      "stem": "What should an embankment proposal assess?",
      "options": [
        "Effects on local and downstream risk",
        "Only whether its wall is tall",
        "Whether it permanently stops rainfall",
        "Whether it removes all sediment forever"
      ],
      "answer": 0,
      "rationale": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_governance_check",
      "conceptId": "gu_governance",
      "purpose": "check",
      "stem": "Which is a basin-level risk reduction measure?",
      "options": [
        "Coordinated warning, zoning and drainage planning",
        "Ignoring wetland loss",
        "Building without flood records",
        "Assuming all floodplains are safe"
      ],
      "answer": 0,
      "rationale": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_governance_transfer",
      "conceptId": "gu_governance",
      "purpose": "transfer",
      "stem": "A barrier protects one settlement but raises water levels near another. How should its success be judged?",
      "options": [
        "Count only the protected settlement",
        "Assume downstream effects cannot occur",
        "Reject every structure regardless of evidence",
        "Compare distributed benefits, shifted risks and alternatives"
      ],
      "answer": 3,
      "rationale": "Flood risk combines physical hazard with exposure, vulnerability and response capacity. Basin planning, warnings, wetlands, zoning and infrastructure can reduce risk. Embankments and dams can shift risk as well as provide protection; assess upstream and downstream effects.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_coordinates_diagnostic",
      "conceptId": "gu_coordinates",
      "purpose": "diagnostic",
      "stem": "Latitude measures position relative to—",
      "options": [
        "A map's paper edge",
        "Only sea level",
        "The nearest road",
        "The Equator"
      ],
      "answer": 3,
      "rationale": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_coordinates_practice",
      "conceptId": "gu_coordinates",
      "purpose": "practice",
      "stem": "Two places share 20 degrees north but have different longitudes. What is shared?",
      "options": [
        "Exact position",
        "Local legal time necessarily",
        "Elevation",
        "Latitude"
      ],
      "answer": 3,
      "rationale": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_coordinates_check",
      "conceptId": "gu_coordinates",
      "purpose": "check",
      "stem": "Which coordinate describes east/west angular position?",
      "options": [
        "Altitude",
        "Map scale",
        "Longitude",
        "Latitude"
      ],
      "answer": 2,
      "rationale": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_coordinates_transfer",
      "conceptId": "gu_coordinates",
      "purpose": "transfer",
      "stem": "A rescue location supplies only 10 degrees north. What additional coordinate is normally needed to specify position?",
      "options": [
        "Only a larger font",
        "Only population density",
        "Only the season",
        "Longitude with its direction/reference"
      ],
      "answer": 3,
      "rationale": "Latitude locates a place north or south of the Equator; longitude locates it east or west of a reference meridian. Both are angular coordinates. A coordinate pair requires direction and a reference system; latitude and longitude are not interchangeable.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_scale_diagnostic",
      "conceptId": "gu_scale",
      "purpose": "diagnostic",
      "stem": "At 1:50,000, 1 cm on the map represents—",
      "options": [
        "50 kilometres",
        "500 kilometres",
        "500 metres",
        "50 metres"
      ],
      "answer": 2,
      "rationale": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_scale_practice",
      "conceptId": "gu_scale",
      "purpose": "practice",
      "stem": "At 1:50,000, 2 cm represents—",
      "options": [
        "10 metres",
        "2 kilometres",
        "1 kilometre",
        "100 kilometres"
      ],
      "answer": 2,
      "rationale": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_scale_check",
      "conceptId": "gu_scale",
      "purpose": "check",
      "stem": "Which map is larger-scale?",
      "options": [
        "1:250,000",
        "1:2,500,000",
        "1:25,000,000",
        "1:25,000"
      ],
      "answer": 3,
      "rationale": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_scale_transfer",
      "conceptId": "gu_scale",
      "purpose": "transfer",
      "stem": "On a different map at 1:100,000, two places are 3 cm apart. What is their represented ground distance?",
      "options": [
        "30 kilometres",
        "300 kilometres",
        "3 kilometres",
        "300 metres"
      ],
      "answer": 2,
      "rationale": "A representative fraction compares map distance with ground distance in the same units. At 1:50,000, one centimetre represents 50,000 centimetres or 500 metres. A larger-scale map has a smaller denominator and usually covers less area with more detail.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_projection_diagnostic",
      "conceptId": "gu_projection",
      "purpose": "diagnostic",
      "stem": "Can a flat world map preserve every geometric property globally?",
      "options": [
        "Yes, with any projection",
        "Yes, if north is at the top",
        "Yes, if the colours are correct",
        "No"
      ],
      "answer": 3,
      "rationale": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_projection_practice",
      "conceptId": "gu_projection",
      "purpose": "practice",
      "stem": "Which projection property matters for comparing countries' areas?",
      "options": [
        "Only familiar appearance",
        "Equal-area preservation",
        "Font size",
        "Only a north arrow"
      ],
      "answer": 1,
      "rationale": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_projection_check",
      "conceptId": "gu_projection",
      "purpose": "check",
      "stem": "What should map interpretation consider?",
      "options": [
        "Only whether the map is popular",
        "Only colour preference",
        "Only page width",
        "Projection, purpose and distortion"
      ],
      "answer": 3,
      "rationale": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_projection_transfer",
      "conceptId": "gu_projection",
      "purpose": "transfer",
      "stem": "Two world maps show different apparent sizes of the same polar region. What should be investigated first?",
      "options": [
        "Whether the region doubled in size overnight",
        "Whether longitude vanished",
        "Whether the map has enough labels",
        "Projection and area distortion"
      ],
      "answer": 3,
      "rationale": "Flattening Earth's curved surface into a map cannot preserve area, shape, distance and direction everywhere at once. Choose a projection for the task and disclose distortion. Equal-area maps are suitable for comparing area; conformal maps preserve local angles, not universal area.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_motions_diagnostic",
      "conceptId": "gu_motions",
      "purpose": "diagnostic",
      "stem": "Earth's daily day/night cycle mainly results from—",
      "options": [
        "Rotation",
        "Seasonal migration",
        "Map projection",
        "Plate collision"
      ],
      "answer": 0,
      "rationale": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_motions_practice",
      "conceptId": "gu_motions",
      "purpose": "practice",
      "stem": "What primarily explains opposite seasons in the two hemispheres?",
      "options": [
        "The Moon changing Earth's map scale",
        "Earth stopping its rotation",
        "Axial tilt during revolution",
        "Both hemispheres being closer to the Sun together"
      ],
      "answer": 2,
      "rationale": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_motions_check",
      "conceptId": "gu_motions",
      "purpose": "check",
      "stem": "Revolution refers to—",
      "options": [
        "Only a river's flow",
        "Only a projection's distortion",
        "Orbital motion around another body",
        "Only spinning around an axis"
      ],
      "answer": 2,
      "rationale": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_motions_transfer",
      "conceptId": "gu_motions",
      "purpose": "transfer",
      "stem": "Imagine an otherwise similar planet with very little axial tilt. Which change is most plausible?",
      "options": [
        "Day/night must disappear",
        "Every hemisphere must have stronger seasons",
        "The planet cannot orbit a star",
        "Weaker tilt-driven seasonal contrasts while rotation still produces day/night"
      ],
      "answer": 3,
      "rationale": "Rotation produces the daily illumination cycle. Seasons primarily arise from axial tilt combined with revolution, changing solar angle and day length. Opposite hemispheres receive different seasonal illumination; changing Earth-Sun distance is not the main seasonal cause.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_monsoon_diagnostic",
      "conceptId": "gu_monsoon",
      "purpose": "diagnostic",
      "stem": "Monsoon primarily describes—",
      "options": [
        "Only daily sea breeze",
        "A fixed river discharge",
        "Seasonal reorganization of circulation and associated rainfall",
        "Any single heavy shower"
      ],
      "answer": 2,
      "rationale": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_monsoon_practice",
      "conceptId": "gu_monsoon",
      "purpose": "practice",
      "stem": "Which combination helps explain South Asian monsoon rainfall?",
      "options": [
        "Only city population",
        "Only the river's name",
        "Only a rainfall total without mechanisms",
        "Circulation, moisture transport, relief and ascent"
      ],
      "answer": 3,
      "rationale": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_monsoon_check",
      "conceptId": "gu_monsoon",
      "purpose": "check",
      "stem": "Why is the giant-sea-breeze analogy incomplete?",
      "options": [
        "Moisture transport is impossible",
        "Regional circulation, convergence, upper winds and relief also matter",
        "Land-ocean contrasts never matter",
        "Monsoon has no seasonality"
      ],
      "answer": 1,
      "rationale": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_monsoon_transfer",
      "conceptId": "gu_monsoon",
      "purpose": "transfer",
      "stem": "Two regions share the seasonal monsoon but lie on different sides of relief. Must their rainfall be identical?",
      "options": [
        "Yes; relief cannot affect moist air",
        "No; circulation is irrelevant to both",
        "No; exposure, ascent and moisture paths can differ",
        "Yes; one monsoon means equal rainfall everywhere"
      ],
      "answer": 2,
      "rationale": "The South Asian monsoon reorganizes atmospheric circulation seasonally. Land-ocean heating contrasts, shifting convergence, pressure gradients, cross-equatorial flow and moisture transport interact with upper-level winds and relief. It is more than a giant sea breeze or a synonym for heavy rain.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    },
    {
      "id": "gu_variability_diagnostic",
      "conceptId": "gu_variability",
      "purpose": "diagnostic",
      "stem": "A climate mode's influence on monsoon should normally be interpreted as—",
      "options": [
        "A probability influence with other factors",
        "A guarantee of identical rainfall everywhere",
        "An exact district forecast without data",
        "Proof that local weather systems do not matter"
      ],
      "answer": 0,
      "rationale": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_variability_practice",
      "conceptId": "gu_variability",
      "purpose": "practice",
      "stem": "What can a near-normal national seasonal total conceal?",
      "options": [
        "No variation at all",
        "The absence of any storms",
        "Identical daily rainfall everywhere",
        "Regional deficits and uneven event timing"
      ],
      "answer": 3,
      "rationale": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "application",
      "distractorTags": {}
    },
    {
      "id": "gu_variability_check",
      "conceptId": "gu_variability",
      "purpose": "check",
      "stem": "Which metadata are needed to interpret a rainfall claim?",
      "options": [
        "Place, period, units, definition and source",
        "Only a catchy headline",
        "Only the number's font size",
        "Only an undated map"
      ],
      "answer": 0,
      "rationale": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "difficulty": 3,
      "expectedTimeSec": 40,
      "dimension": "conceptual",
      "distractorTags": {}
    },
    {
      "id": "gu_variability_transfer",
      "conceptId": "gu_variability",
      "purpose": "transfer",
      "stem": "A seasonal forecast suggests reduced rainfall probability, but a district floods after one intense storm. Is this necessarily contradictory?",
      "options": [
        "No; seasonal probabilities and individual events differ",
        "Yes; seasonal forecasts forbid all heavy events",
        "Yes; a probability is a guarantee",
        "No; forecasts contain no useful information"
      ],
      "answer": 0,
      "rationale": "Monsoon rainfall varies within a season and between years. Moisture paths, weather systems, active/break periods and ocean-atmosphere variability interact. A climate mode can change probabilities without determining each year's or district's outcome. Evaluate dates, geography and uncertainty before using a forecast or statistic.",
      "difficulty": 4,
      "expectedTimeSec": 60,
      "dimension": "transfer",
      "distractorTags": {}
    }
  ]
} as const;
