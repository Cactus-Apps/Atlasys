const fs = require("fs");
const path = require("path");

const javaDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-geolocation-service",
  "android",
  "src",
  "main",
  "java",
  "com",
  "agontuk",
  "RNFusedLocation",
);

const utilsFile = path.join(javaDir, "LocationUtils.java");
const moduleFile = path.join(javaDir, "RNFusedLocationModule.java");
const managerFile = path.join(javaDir, "LocationManagerProvider.java");
const fusedFile = path.join(javaDir, "FusedLocationProvider.java");

if (!fs.existsSync(utilsFile) || !fs.existsSync(moduleFile)) {
  console.log(
    "patch-geolocation-service: skipped (react-native-geolocation-service not installed)",
  );
  process.exit(0);
}

const MARKER = "/* ATLASYS_PATCHED: no Google Play Services */";

let utils = fs.readFileSync(utilsFile, "utf8");
let mod = fs.readFileSync(moduleFile, "utf8");

if (!utils.includes(MARKER)) {
  const gmsImports =
    "import com.google.android.gms.common.ConnectionResult;\n" +
    "import com.google.android.gms.common.GoogleApiAvailability;\n";
  const gmsBody = [
    "  public static boolean isGooglePlayServicesAvailable(Context context) {",
    "    int result = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context);",
    "",
    "    // TODO: Handle other possible success types.",
    "    return result == ConnectionResult.SUCCESS || result == ConnectionResult.SERVICE_UPDATING;",
    "  }",
  ].join("\n");

  if (!utils.includes(gmsImports) || !utils.includes(gmsBody)) {
    throw new Error(
      "patch-geolocation-service: expected Google Play Services sources were not found",
    );
  }

  utils = utils
    .replace(gmsImports, `${MARKER}\n`)
    .replace(
      gmsBody,
      [
        `${MARKER}`,
        "  public static boolean isGooglePlayServicesAvailable(Context context) {",
        "    // Always false: this fork deliberately avoids Google Play Services so the",
        "    // app keeps working on F-Droid builds that do not ship them. Callers fall",
        "    // back to the AOSP LocationManager instead of the fused provider.",
        "    return false;",
        "  }",
      ].join("\n"),
    );

  fs.writeFileSync(utilsFile, utils);
}

if (!mod.includes(MARKER)) {
  const providerFactory = [
    "  private LocationProvider createLocationProvider(boolean forceLocationManager) {",
    "    ReactApplicationContext context = getContext();",
    "    boolean playServicesAvailable = LocationUtils.isGooglePlayServicesAvailable(context);",
    "",
    "    if (forceLocationManager || !playServicesAvailable) {",
    "      return new LocationManagerProvider(context, this);",
    "    }",
    "",
    "    return new FusedLocationProvider(context, this);",
    "  }",
  ].join("\n");

  if (!mod.includes(providerFactory)) {
    throw new Error(
      "patch-geolocation-service: expected createLocationProvider source was not found",
    );
  }

  mod = mod.replace(
    providerFactory,
    [
      `  ${MARKER}`,
      "  private LocationProvider createLocationProvider(boolean forceLocationManager) {",
      "    // Always the AOSP LocationManager: the fused provider is Google Play Services",
      "    // only and is deliberately not bundled in F-Droid builds.",
      "    return new LocationManagerProvider(getContext(), this);",
      "  }",
    ].join("\n"),
  );

  fs.writeFileSync(moduleFile, mod);
}

// The stock LocationManagerProvider silently fails with POSITION_UNAVAILABLE
// ("No location provider available.") when location services are switched off,
// because getBestProvider() returns null and there is no way to ask the user to
// enable location without Google Play Services. The Play Services build handled
// this with a system dialog, so replace the implementation with one that opens
// the AOSP location settings screen and retries on return. It also prefers the
// providers that work on de-Googled devices (GPS and the AOSP fused provider).
const MANAGER_MARKER = "/* ATLASYS_PATCHED: AOSP LocationManager without Play Services */";

let manager = fs.readFileSync(managerFile, "utf8");

if (!manager.includes(MANAGER_MARKER)) {
  const anchor = "public class LocationManagerProvider implements LocationProvider {";

  if (!manager.includes(anchor)) {
    throw new Error(
      "patch-geolocation-service: expected LocationManagerProvider source was not found",
    );
  }

  manager = `${MANAGER_MARKER}
package com.agontuk.RNFusedLocation;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactApplicationContext;

import java.util.ArrayList;
import java.util.List;

public class LocationManagerProvider implements LocationProvider {
  private final ReactApplicationContext context;
  private final LocationManager locationManager;
  private final LocationChangeListener locationChangeListener;

  private boolean isSingleUpdate = false;
  private int activityRequestCode = -1;
  private LocationOptions pendingOptions = null;

  private final LocationListener locationListener = new LocationListener() {
    @Override
    public void onLocationChanged(Location location) {
      locationChangeListener.onLocationChange(LocationManagerProvider.this, location);

      if (isSingleUpdate) {
        timeoutHandler.removeCallbacks(timeoutRunnable);
        removeLocationUpdates();
      }
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
      // Deprecated and no longer invoked on recent Android versions. Only treat
      // a provider going away as an error when location services are actually
      // switched off; transient OUT_OF_SERVICE states are normal while the GPS
      // warms up.
      if (status == android.location.LocationProvider.OUT_OF_SERVICE &&
        !LocationUtils.isLocationEnabled(context)) {
        locationChangeListener.onLocationError(
          LocationManagerProvider.this,
          LocationError.POSITION_UNAVAILABLE,
          null
        );
      }
    }

    @Override
    public void onProviderEnabled(String provider) {
      //
    }

    @Override
    public void onProviderDisabled(String provider) {
      if (!LocationUtils.isLocationEnabled(context)) {
        locationChangeListener.onLocationError(
          LocationManagerProvider.this,
          LocationError.POSITION_UNAVAILABLE,
          null
        );
      }
    }
  };
  private final Handler timeoutHandler = new Handler(Looper.getMainLooper());
  private final Runnable timeoutRunnable = new Runnable() {
    @Override
    public void run() {
      locationChangeListener.onLocationError(
        LocationManagerProvider.this,
        LocationError.TIMEOUT,
        null
      );
      removeLocationUpdates();
    }
  };

  public LocationManagerProvider(ReactApplicationContext context, LocationChangeListener locationChangeListener) {
    this.context = context;
    this.locationChangeListener = locationChangeListener;
    this.locationManager = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);
  }

  @SuppressLint("MissingPermission")
  @Override
  public void getCurrentLocation(LocationOptions locationOptions) {
    this.isSingleUpdate = true;
    String provider = getBestProvider(locationOptions.getAccuracy());

    if (provider != null) {
      Location location = locationManager.getLastKnownLocation(provider);

      if (location != null &&
        LocationUtils.getLocationAge(location) < locationOptions.getMaximumAge()
      ) {
        Log.i(RNFusedLocationModule.TAG, "returning cached location.");
        locationChangeListener.onLocationChange(LocationManagerProvider.this, location);
        return;
      }
    }

    startWithProviderOrError(locationOptions, true);
  }

  @Override
  public boolean onActivityResult(int requestCode, int resultCode) {
    if (requestCode != activityRequestCode) {
      return false;
    }

    activityRequestCode = -1;
    LocationOptions options = pendingOptions;
    pendingOptions = null;

    if (options != null) {
      // Do not prompt again: if the user did not enable location we report the
      // error instead of bouncing them straight back to the settings screen.
      startWithProviderOrError(options, false);
    }

    return true;
  }

  @Override
  public void requestLocationUpdates(LocationOptions locationOptions) {
    this.isSingleUpdate = false;
    startWithProviderOrError(locationOptions, true);
  }

  @SuppressLint("MissingPermission")
  @Override
  public void removeLocationUpdates() {
    locationManager.removeUpdates(locationListener);
  }

  @SuppressLint("MissingPermission")
  private void startWithProviderOrError(LocationOptions locationOptions, boolean allowPrompt) {
    String provider = getBestProvider(locationOptions.getAccuracy());

    if (provider == null) {
      // No enabled provider means location services are switched off. Mirror the
      // Play Services implementation and take the user to the system location
      // settings so the feature can actually be enabled.
      if (allowPrompt &&
        locationOptions.isShowLocationDialog() &&
        openLocationSettings(locationOptions)) {
        return;
      }

      locationChangeListener.onLocationError(
        LocationManagerProvider.this,
        LocationError.SETTINGS_NOT_SATISFIED,
        null
      );
      return;
    }

    startLocationUpdates(
      provider,
      locationOptions.getInterval(),
      isSingleUpdate ? 0 : locationOptions.getDistanceFilter(),
      locationOptions.getTimeout()
    );
  }

  private boolean openLocationSettings(LocationOptions locationOptions) {
    Activity activity = context.getCurrentActivity();

    if (activity == null) {
      return false;
    }

    Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
    activityRequestCode = 10000 + (int) (System.currentTimeMillis() % 10000);
    pendingOptions = locationOptions;

    try {
      activity.startActivityForResult(intent, activityRequestCode);
      return true;
    } catch (Exception e) {
      Log.e(RNFusedLocationModule.TAG, "Unable to open location settings", e);
      activityRequestCode = -1;
      pendingOptions = null;
      return false;
    }
  }

  @Nullable
  private String getBestProvider(LocationAccuracy locationAccuracy) {
    List<String> enabledProviders = locationManager.getProviders(true);

    if (enabledProviders == null) {
      enabledProviders = new ArrayList<>();
    }

    // Prefer the providers that work without Google Play Services. GPS is the
    // most reliable on de-Googled devices; the platform fused provider (AOSP,
    // Android 12+) adds Wi-Fi/cell fusion where a network backend exists.
    List<String> preferredProviders = new ArrayList<>();
    preferredProviders.add(LocationManager.GPS_PROVIDER);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      preferredProviders.add(LocationManager.FUSED_PROVIDER);
    }

    preferredProviders.add(LocationManager.NETWORK_PROVIDER);

    for (String provider : preferredProviders) {
      if (enabledProviders.contains(provider)) {
        return provider;
      }
    }

    String provider = locationManager.getBestProvider(getProviderCriteria(locationAccuracy), true);

    if (provider != null) {
      return provider;
    }

    return enabledProviders.isEmpty() ? null : enabledProviders.get(0);
  }

  private Criteria getProviderCriteria(LocationAccuracy locationAccuracy) {
    int accuracy;
    int baseAccuracy;
    int power;

    switch (locationAccuracy) {
      case high:
        accuracy = Criteria.ACCURACY_HIGH;
        baseAccuracy = Criteria.ACCURACY_FINE;
        power = Criteria.POWER_HIGH;
        break;
      case balanced:
        accuracy = Criteria.ACCURACY_MEDIUM;
        baseAccuracy = Criteria.ACCURACY_COARSE;
        power = Criteria.POWER_MEDIUM;
        break;
      case low:
        accuracy = Criteria.ACCURACY_LOW;
        baseAccuracy = Criteria.ACCURACY_COARSE;
        power = Criteria.POWER_LOW;
        break;
      case passive:
        accuracy = Criteria.NO_REQUIREMENT;
        baseAccuracy = Criteria.NO_REQUIREMENT;
        power = Criteria.NO_REQUIREMENT;
        break;
      default:
        throw new IllegalStateException("Unexpected value: " + locationAccuracy);
    }

    Criteria criteria = new Criteria();
    criteria.setAccuracy(baseAccuracy);
    criteria.setBearingAccuracy(accuracy);
    criteria.setHorizontalAccuracy(accuracy);
    criteria.setPowerRequirement(power);
    criteria.setSpeedAccuracy(accuracy);
    criteria.setVerticalAccuracy(accuracy);

    return criteria;
  }

  @SuppressLint("MissingPermission")
  private void startLocationUpdates(String provider, long minTime, float minDistance, long timeout) {
    locationManager.requestLocationUpdates(
      provider,
      minTime,
      minDistance,
      locationListener,
      Looper.getMainLooper()
    );

    if (isSingleUpdate) {
      if (timeout > 0 && timeout != Long.MAX_VALUE) {
        timeoutHandler.postDelayed(timeoutRunnable, timeout);
      }
    }
  }
}
`;

  fs.writeFileSync(managerFile, manager);
}

// The fused provider is the last class referencing Google Play Services.
// Nothing reaches it after the patch above, so drop the source file instead
// of relying on R8 to strip unreachable code from release builds only.
if (fs.existsSync(fusedFile)) {
  fs.rmSync(fusedFile);
}

console.log("patch-geolocation-service: patched");