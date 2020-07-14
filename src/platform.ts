import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { HaikuPlatformAccessory } from './platformAccessory';
import { Device, SenseME } from '@nightbird/haiku-senseme';

/**
 * HomebridgeHaikuPlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeHaikuPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info(`Loading accessory from cache: ${accessory.UUID} ${accessory.displayName}`);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    //this.accessories.push(accessory);
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {
    
    const device = new Device({ name: 'Master Bedroom Light', id: '20:F8:5E:E2:4C:98', type: 'HAIKU,LIGHT', ip: '10.0.1.25' });

    const deviceData = {
      name: device.name,
      type: device.type,
      id: device.id,
    };

    this.log.debug('dumping:', deviceData);

    this.log.debug(`dev id: ${device.id}`);
    const uuid = this.api.hap.uuid.generate(device.id as string);
    this.log.debug(`uuid: ${uuid}`);

    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      // the accessory already exists
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

      // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
      this.log.debug(`accessory info - name: ${existingAccessory.displayName} uuid: ${existingAccessory.UUID}`);
      existingAccessory.context.device = deviceData;
      try {
        this.api.updatePlatformAccessories([existingAccessory]);
      } catch (e) {
        this.log.debug(e);
      }

      // create the accessory handler for the restored accessory
      // this is imported from `platformAccessory.ts`
      new HaikuPlatformAccessory(this, existingAccessory);

    } else {
      const accessory = new this.api.platformAccessory(device.name, uuid, this.api.hap.Categories.LIGHTBULB);
      this.log.debug(`accessory info - name: ${accessory.displayName} uuid: ${accessory.UUID}`);
      accessory.context.device = deviceData;
      new HaikuPlatformAccessory(this, accessory);
      try {
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      } catch (e) {
        this.log.debug(e); 
      }
    }

    /*SenseME.setConfig({ broadcastAddress: undefined })
      .on('founddevice', (device: Device) => {
        this.log.info(`Found a device: ${device.name} (${device.id})`);
        const uuid = this.api.hap.uuid.generate(device.id);
        this.log.info(`assign uuid ${uuid} to ${device.name}`);
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
          existingAccessory.context.name = device.name;
          existingAccessory.context.type = device.type;
          existingAccessory.context.id = device.id;
          this.api.updatePlatformAccessories([existingAccessory]);
          new HaikuPlatformAccessory(this, existingAccessory);
        } else {
          this.log.info('Adding new accessory:', device.name);
          const accessory = new this.api.platformAccessory(device.name, uuid);
          accessory.context.name = device.name;
          accessory.context.type = device.type;
          accessory.context.id = device.id;
          this.log.debug(`name: ${accessory.displayName} uuid: ${accessory.UUID}`);
          new HaikuPlatformAccessory(this, accessory);
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      })
      .on('lostdevice', (device: Device) => {
        this.log.info(`Lost a device: ${device.name} (${device.ip})`);
      })
      .discover();

    // run discovery for 30 seconds
    setTimeout(() => {
      SenseME.cancelDiscovery();
      SenseME.getAllDevices().forEach(dev => dev.disconnect());
      //return SenseME.getAllDevices();
    }, 30000);*/
  

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    /*const exampleDevices = [
      {
        ip: '10.0.1.25',
        id: '20:F8:5E:E2:4C:90',
        name: 'Master Bedroom Light',
        type: 'LIGHT,HAIKU',
      },
      {
        ip: '10.0.1.16',
        id: '20:F8:5E:E2:4D:80',
        name: 'Entryway Light',
        type: 'LIGHT,HAIKU',
      },
    ];

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of exampleDevices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.id);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new HaikuPlatformAccessory(this, existingAccessory);

      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new HaikuPlatformAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }

      // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
      // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }*/

  }
}
