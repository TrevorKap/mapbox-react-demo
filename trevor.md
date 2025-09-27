### Mapbox style config and fallback

Hi I added logic so now the code will try and read your custom map still from the env but if it doesn't find it, it will default to the base map. 

All you need to do to try a custom style is make sure your .env.local has these values set:
REACT_APP_MAPBOX_STYLE_URL=
REACT_APP_MAPBOX_TOKEN=

The REACT_APP_MAPBOX_STYLE_URL is all you need to change when you want to try a different mapbox style. 

