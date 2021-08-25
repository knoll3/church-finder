import React from "react";
import { useStyles } from "./styles";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
} from "react-simple-maps";
import geoData from "resources/world-110m.json";
import usaData from "resources/usa-polygon.json";
import {
    point,
    polygon,
    featureCollection,
    envelope,
    pointGrid,
    BBox,
} from "@turf/turf";

interface Marker {
    coordinates: [number, number];
}

// a^2 + b^2 = c^2
// a^2 + a^2 = 50^2
// 2*a^2 = 2500
// a^2 = 1250
// a = sqrt(1250)

export const MapChart: React.FC = () => {
    const radiusCheck = 50;
    const resolution = Math.floor(Math.sqrt(radiusCheck ** 2 / 2));

    const classes = useStyles();

    const markers: Marker[] = usaData.map((x) => ({
        coordinates: [x[0], x[1]],
    }));

    const usaPoints = usaData.map((x) => point([x[0], x[1]]));
    const usaFeatureCollection = featureCollection(usaPoints);
    const enveloped = envelope(usaFeatureCollection);
    const turfPoly = polygon([usaData]);

    const grid = pointGrid(enveloped.bbox || ({} as BBox), resolution, {
        mask: turfPoly,
        units: "miles",
    });
    console.log(grid);

    const numberOfRequests = grid.features.length;
    const requestsPerSec = 1;
    const time = numberOfRequests * requestsPerSec;

    const exportData = grid.features.map((x) => [
        x.geometry.coordinates[0],
        x.geometry.coordinates[1],
    ]);

    return (
        <ComposableMap
            projection="geoAzimuthalEqualArea"
            projectionConfig={{
                rotate: [100, -40, 0],
                scale: 800,
            }}
        >
            <Geographies geography={geoData}>
                {({ geographies }) =>
                    geographies
                        .filter((d) => d.properties.REGION_UN === "Americas")
                        .map((geo) => (
                            <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                fill="#EAEAEC"
                                stroke="#D6D6DA"
                            />
                        ))
                }
            </Geographies>
            {markers.map(({ coordinates }) => (
                <Marker
                    key={JSON.stringify(coordinates)}
                    coordinates={coordinates}
                >
                    <circle r={3} fill="#F00" stroke="#fff" strokeWidth={2} />
                </Marker>
            ))}
            {grid.features.map((feature, i) => (
                <Marker
                    key={i}
                    coordinates={[
                        feature.geometry.coordinates[0],
                        feature.geometry.coordinates[1],
                    ]}
                >
                    <circle r={3} fill="#00F" stroke="#fff" strokeWidth={2} />
                </Marker>
            ))}
        </ComposableMap>
    );
};
