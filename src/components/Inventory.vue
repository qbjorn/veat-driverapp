<template>
    <div>
      <div :key="`${machineId}-${machineName}`">
        <h6
          class="q-pt-1 q-pb-1 q-mt-1 q-mb-1 text-primary"
        >
          <span class="q-pt-lg">{{ `${currentPage==0?'Waste':'Refill'} for ${machineName} ${machine.isfridge===1?'(Fr.)':'(Ma.)'}` }}</span>
          <!-- span style="float: right">Show empty <q-checkbox v-model="showEmptyChannels" /></span -->
        </h6>
        
      </div>
      <div v-if="loadingInventory" class="overlay">
      <div class="overlay-content">
        <q-spinner size="50px" />
        <p>Loading inventory...</p>
      </div>
    </div>
       <div v-show="!loadingInventory && !savingInventory">
        <div v-show="currentPage==0">
          <!-- buttons -->
          <div class="row q-mb-md q-pb-md q-mt-0">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn icon="cancel" @click="cancelChanges" class="bg-green-2" label="Cancel" />
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="nextPage" class="bg-green-1" label="Next >" />
            </div>
          </div>
          <!-- Header Row -->
          <div class="header-row">
            <div class="header-item">Channel & Product Name</div>
            <div class="header-item">Waste</div>
            <div class="header-item">Move to other machine</div>
            <div class="header-item">Number in machine after waste and move</div>
          </div>
          <!-- Inventory Rows -->
          <div
            v-for="inventoryLine, index in inventoryLines"
            :key="inventoryLine.channel"
            class="inventory-row"
          >
            <!-- Category Header -->
            <div
              v-if="inventoryLine.groupheader !== ''"
              class="category-header"
            >
              <b>{{ inventoryLine.category }} ({{ inventoryLine.origin }})</b>
            </div>

            <!-- Data Row -->
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="data-row"
            >
              <div class="data-item">
                <div class="text-bold">
                  <span
                    class="q-mt-2"
                    :class="`${inventoryLine.setArchive === true ? 'text-red text-bold text-strike' : ''}`"
                  >
                    {{ inventoryLine.channel }}.
                    &nbsp;&nbsp;{{ inventoryLine.productName }}</span>
                  <q-btn
                    v-if="inventoryLine.newBalance == 0 && inventoryLine.setArchive === false"
                    @click="archiveMachineChannelInput(inventoryLine.channel)"
                    title="Remove channel"
                    class="q-mt-0 q-ml-0"
                    flat
                    outline
                    icon="delete"
                  />
                  <q-btn
                    v-if="inventoryLine.newBalance == 0 && inventoryLine.setArchive === true"
                    @click="inventoryLine.setArchive=false"
                    title="Undo remove channel"
                    class="q-mt-0 q-ml-0"
                    flat
                    outline
                    icon="undo"
                  />
                </div>
              </div>
              <div class="data-item">
                <label class="input-label">Waste</label>
                <q-input
                  v-model="inventoryLine.spoil"
                  @update:model-value="value => updateSpoilFields('spoil', value, index)"
                  @focus="selectInput"
                  input-style="text-align: right"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  hide-bottom-space
                  hide-top-space
                />
              </div>
              <div class="data-item">
                <label class="input-label">Move to other machine</label>
                <q-input
                  v-model="inventoryLine.moveout"
                  @update:model-value="value => updateSpoilFields('moveout', value, index)"
                  @focus="selectInput"
                  input-style="text-align: right;"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  hide-bottom-space
                  hide-top-space
                />
              </div>
              <div class="data-item">
                <label class="input-label">Number in machine after waste and move</label>
                <q-input
                  v-model="inventoryLine.newBalance"
                  @update:model-value="value => updateSpoilBalance(value, index)"
                  @focus="selectInput"
                  input-style="text-align: right"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  hide-bottom-space
                  hide-top-space
                />
              </div>
            </div>
          </div>
          <div class="row q-pb-md q-pt-md q-mt-md">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn icon="cancel" @click="cancelChanges" class="bg-green-2" label="Cancel " />
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="nextPage" color="primary" label="Next >" />
            </div>
          </div>
        </div>
        <!-- Second page - refill and outgoing balance -->
        <div v-show="currentPage==1">
          <div class="row q-mb-md q-pb-md q-mt-0">
            <div class="col-5 text-left q-pl-0 q-ml-0">
              <q-btn @click="currentPage = 0" class="bg-green-2" label="< Back" />
              <!-- <q-btn @click="addingMenuItem=true" outline class="border-green-2 q-ml-md" label="+ Menu item" /> -->
            </div>
            <div class="col-7 text-right q-pr-0 q-mr-0">
              <q-btn class="bg-green-2 q-mr-md" @click="addChannelInput" :disabled="savingInventory" label="+ Channel" />
              <q-btn @click="saveChanges" :disabled="savingInventory" color="primary" label="Save" />
            </div>
          </div>

          <!-- Header Row -->
          <div class="header-row">
            <div class="header-item">Channel & Product Name</div>
            <div class="header-item">Refill</div>
            <div class="header-item">Moved in from other machine</div>
            <div class="header-item">Number in machine after refill and move in</div>
          </div>

          <!-- Inventory Rows -->
          <div
            v-for="inventoryLine, index in inventoryLines"
            :key="inventoryLine.channel"
            class="inventory-row"
          >
            <!-- New channel header -->
            <div v-if="inventoryLine.newLine" class="category-header bg-white text-green"><b>ADDED CHANNEL</b></div>
            <!-- Category Header -->
            <div
              v-if="inventoryLine.groupheader !== ''"
              class="category-header"
            >
              <b>{{ inventoryLine.category }} ({{ inventoryLine.origin }})</b>
            </div>

            <!-- Data Row -->
            <div class="data-item">
              <div class="text-bold">
                <span
                  class="q-mt-2"
                  :class="`${inventoryLine.setArchive === true ? 'text-red text-bold text-strike' : ''}`"
                >
                  {{ inventoryLine.channel }}.
                  &nbsp;&nbsp;{{ inventoryLine.productName }}</span>
                </div>
            </div>
            <div class="data-item">
              <label class="input-label">Refill</label>
              <q-input
                v-model="inventoryLine.resupply"
                @update:model-value="value => updateResupplyFields('resupply', value, index)"
                @focus="selectInput"
                input-style="text-align: right"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                hide-bottom-space
                hide-top-space
              />
            </div>
            <div class="data-item">
              <label class="input-label">Move in from another machine</label>
              <q-input
                v-model="inventoryLine.movein"
                @update:model-value="value => updateResupplyFields('movein', value, index)"
                @focus="selectInput"
                input-style="text-align: right"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                hide-bottom-space
                hide-top-space
              />
            </div>            
            <div class="data-item">
              <label class="input-label">Number in machine after refill and move in</label>
              <div style="display: inline-block;text-align: right !important;" class="balance-value q-pt-md text-bold text-right">{{ inventoryLine.newBalance }}</div>
            </div>
          </div>
          <div class="row q-pb-md q-pt-md q-mt-md">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <!-- <q-btn @click="cancelChanges" class="bg-green-2" label="Cancel " /> -->
              <q-btn @click="currentPage = 0" class="bg-green-2" label="< Back" />
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn class="bg-green-2 q-mr-md" @click="addChannelInput" :disabled="savingInventory" label="Add channel" />
              <q-btn @click="saveChanges" :disabled="savingInventory" color="primary" label="Save" />
            </div>
          </div>
        </div>
      </div>
      <q-dialog v-model="saveError">
        <q-card>
          <q-card-section>
            <div class="text-h6">Error</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{  saveMessage }}
          </q-card-section>

          <q-card-actions>
            <div class="col-12 text-right q-pr-0 q-mr-0">
              <q-btn @click="saveError=false" color="primary" label="OK" v-close-popup/>
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="addingChannel">
        <q-card>
          <q-card-section>
            <div class="text-h6">Add channel</div>
          </q-card-section>
          <q-card-section>
            <div v-if="addChannelError" class="text-negative">{{ addChannelMessage }}</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input
              v-model="newChannel"
              @focus="selectInput"
              label="Channel"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
            />
          </q-card-section>
          <q-card-section>
            <q-select v-model="newProduct" :options="menuItemProductOptions" label="Product" />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input
              v-model="newRefill"
              @focus="selectInput"
              label="Refill"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
            />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input
              v-model="newMoveIn"
              @focus="selectInput"
              label="Move In"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
            />
          </q-card-section>
          <q-card-actions>
            <div class="col-6 text-left q-pr-0 q-mr-0">
              <q-btn @click="() => abortAddChannel()" class="bg-green-2" label="Cancel" v-close-popup/>
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="addChannel" color="primary" label="Add"/>
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="archivingChannel">
        <q-card>
          <q-card-section>
            <div class="text-h6">Remove channel</div>
          </q-card-section>
          <q-card-section>
            <div v-if="archiveChannelError" class="text-negative">{{ archiveChannelMessage }}</div>
          </q-card-section>
          <q-card-section>
            <div class="text-negative">Are you sure you want to remove channel {{ archiveChannel }}?</div>
          </q-card-section>
          <q-card-actions>
            <div class="col-6 text-left q-pr-0 q-mr-0">
              <q-btn @click="() => abortArchiveMachineChannel()" class="bg-green-2" label="Cancel" v-close-popup/>
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="archiveMachineChannel(archiveChannel)" color="primary" label="Remove"/>
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="addingMenuItem">
        <q-card>
          <q-card-section>
            <div class="text-h6">Add Menu Item</div>
          </q-card-section>
          <q-card-section>
            <div v-if="addMenuItemError" class="text-negative">{{ addChannelMessage }}</div>
          </q-card-section>
          <q-card-section>
            <q-select v-model="addMenuItemProduct" :options="allProductsOptions" label="Product" />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input
              v-model="addMenuItemOverridePrice"
              @focus="selectInput"
              label="Override price"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
            />
          </q-card-section> 
          <q-card-actions>
            <div class="col-6 text-left q-pr-0 q-mr-0">
              <q-btn @click="() => abortAddChannel()" class="bg-green-2" label="Cancel" v-close-popup/>
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="addChannel" color="primary" label="Add"/>
            </div>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="savingInventory">
        <q-card>
          <q-card-section>
            <div class="text-h6">Saving inventory</div>
          </q-card-section>
          <q-card-section>
            <q-spinner
              class="mr-md"
              color="primary"
              size="3em"
              :thickness="2"
            />Saving channel {{ savingChannel }}...
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
</template>
<script>
import { ref, watch, inject } from 'vue'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@vue/apollo-composable'
import iconSet from "quasar/icon-set/ionicons-v4";
import "@quasar/extras/ionicons-v4/ionicons-v4.css";

const GET_MACHINE = gql`
  query MachineById($machineByIdId: ID!) {
    machineById(id: $machineByIdId) {
      location
      isfridge
      channels
    }
  }
`;
const GET_MACHINE_MENU_ITEMS = gql`
  query MenuItemsByMachineId($input: MenuItemsByMachineIdInput!) {
    menuItemsByMachineId(input: $input) {
      product {
        id
        texts {
          name
        }
        origin
      }
    }
  }
`;
const GET_INVENTORY_QUERY = gql`
  query StockTransactionV2machineInventory($machineId: ID!) {
    stockTransactionV2machineInventory(machineId: $machineId) {
      machineId
      channelInfo {
        channel
        balance
        productId
        product {
          category
          texts {
            name
          }
          origin
        }
      }
    }
  }
`;
const GET_PRODUCTS_QUERY = gql`
  query Products {
    products {
      id
      texts {
        name
      }
      origin
      category
    }
  }
`;

const UPDATE_EVERYTHING_FOR_ONE_CHANNEL = gql`
  mutation UpdateEverythingForOneChannel($input: updateEverythingLine!) {
    updateEverythingForOneChannel(input: $input)
  }
`;


export default {
  name: 'Inventory',
  config: {
    iconSet,
  },
  props: {
    driverId: String,
    machineId: String,
    machineName: String,
    savingInventory: ref(false),
    multilog: Object,
  },
  data: function() {
    return {
      savingSpoil: false,
      savingResupply: false,
      savingChannel: 0,
    }
  },
  setup(props) {
    const showEmptyChannels = ref(true)
    const currentPage = ref(0);
    const savingInventory = props.savingInventory;
    const machineId = props.machineId;
    const driverId = props.driverId;
    const machine = ref({})
    const inventoryLines = ref([]);
    const menuItemProducts = ref([]);
    const menuItemProductOptions = ref([]);
    const saveError = ref(false);
    const saveMessage = ref('')
    const addingChannel = ref(false);
    const newChannel = ref(0);
    const newProduct = ref('');
    const newRefill = ref(0);
    const newMoveIn = ref(0);
    const addChannelError = ref(false);
    const addChannelMessage = ref('');
    const multilog = ref(props.multilog);

    const logInventoryAction = async (action, details) => {
      try {
        await multilog.value.multilogLogMutation({
          logLevel: 5,
          apiToken: multilog.value.apiToken,
          clientToken: multilog.value.clientToken,
          gqlToken: multilog.value.gqlToken,
          userId: driverId,
          machineId,
          logPath: `DriverApp.${action}`,
          logText: details
        });
      } catch (error) {
        console.error('Failed to log inventory action:', error);
      }
    };
    
    const addChannelInput = () => {
      addChannelError.value = false;
      addChannelMessage.value = '';
      addingChannel.value = true;
      newChannel.value = 0;
      newProduct.value = '';
      newRefill.value = 0;
      newMoveIn.value = 0;
    }
    const addChannel = () => {
      addChannelMessage.value = '';
      if (newChannel && newChannel.value) {
        inventoryLines.value.forEach((line) => {
          const newChannelNumber = parseInt(newChannel.value);
          // console.log(`Checking ${line.channel} (${typeof line.channel}) against ${newChannelNumber} (${typeof newChannelNumber})`);
          if (line.channel === newChannelNumber && line.setArchive !== true) {
            addChannelError.value = true;
            addChannelMessage.value = 'Channel already exists';
          }
        });
        if (!addChannelError.value) {
          const newChannelNumber = parseInt(newChannel.value);
          // console.log(`Checking ${machine.value.channels} (${typeof machine.value.channels}) against ${newChannelNumber} (${typeof newChannelNumber})`);
          const machineHasChannel = machine.value.channels.includes(newChannelNumber);
          if (!machineHasChannel) {
            addChannelError.value = true;
            addChannelMessage.value = 'Channel does not exist in machine';
          }
        }
        if (!addChannelError.value) {
          // console.log(`Checking ${newProduct.value} (${typeof newProduct.value})`);
          if (!newProduct.value) {
            addChannelError.value = true;
            addChannelMessage.value = 'Please select a product';
          }
        }
        if (!addChannelError.value) {
          inventoryLines.value.push({
            machineId: props.machineId,
            channel: parseInt(newChannel.value),
            productId: newProduct.value.value,
            productName: newProduct.value.label,
            category: newProduct.category,
            origin: newProduct.origin,
            groupheader: '',
            balance: 0,
            spoil: 0,
            moveout: 0,
            resupply: parseInt(newRefill.value),
            movein: parseInt(newMoveIn.value),
            newBalance: parseInt(newRefill.value) + parseInt(newMoveIn.value),
            oldBalance: 0,
            odd: false,
            dirty: true,
            spoilDirty: false,
            resupplyDirty: true,
            newLine: true,
            setArchive: false,
          });
          showEmptyChannels.value = true;
          abortAddChannel();
        }
      } else {
        addingChannel.value = true;
        addChannelError.value = true;
        addChannelMessage.value = 'Please enter a channel number';
      }
    }
    const abortAddChannel = () => {
      addingChannel.value = false;
      addChannelError.value = false;
      addChannelMessage.value = '';
      newChannel.value = 0;
      newProduct.value = '';
    }
    const archiveChannelError = ref(false);
    const archiveChannelMessage = ref('');
    const archivingChannel = ref(false);
    const archiveChannel = ref(0);
    const addingMenuItem = ref(false);
    const addMenuItemError = ref(false);
    const addMenuItemOverridePrice = ref(0);
    const addMenuItemProduct = ref('');
    
    const archiveMachineChannelInput = (channel) => {
      archiveChannelError.value = false;
      archiveChannelMessage.value = '';
      archivingChannel.value = true;
      archiveChannel.value = channel;
    }
    const archiveMachineChannel = async(channel) => {
      const index = inventoryLines.value.findIndex(line => line.channel === channel);
      if (index !== -1 && inventoryLines.value[index].newBalance === 0) {
        inventoryLines.value[index].setArchive = true;
        abortArchiveMachineChannel()
      } else {
        archiveChannelError.value = true;
        archiveChannelMessage.value = `Could not remove channel ${channel}, it must have 0 balance to be removed`;
        archivingChannel.value = true;
      }
    }
    const abortArchiveMachineChannel = () => {
      archiveChannelError.value = false;
      archiveChannelMessage.value = '';
      archiveChannel.value = 0;
      archivingChannel.value = false;
    }
    const { result: machineResult, loading: loadingMachine, error: errorMachine, refetch: refetchMachine } = useQuery(
      GET_MACHINE,
      { machineByIdId: machineId }
    );
    const { result: menuItemsResult, loading: loadingMenuItems, error: erroMenuItems, refetch: refetchMenuItems } = useQuery(
      GET_MACHINE_MENU_ITEMS,
      { input: { machineId: machineId, includeUnavailable: true  },
    })
    const { result: inventoryResult, loading: loadingInventory, error: errorInventory, refetch } = useQuery(GET_INVENTORY_QUERY, {
      machineId
    });
    const { result: productsResult, loading: loadingProducts, error: errorProducts, refetch: refetchProducts } = useQuery(GET_PRODUCTS_QUERY);

    const { mutate: updateEverythingForOneChannel } = useMutation(UPDATE_EVERYTHING_FOR_ONE_CHANNEL);

    // Watch for changes in machineId prop
    watch(() => props.machineId, async(newMachineId) => {
      currentPage.value = 0;
      await refetchMachine({ machineByIdId: newMachineId });
      await refetch({ machineId: newMachineId });
      await refetchMenuItems({ input: { machineId: newMachineId }})
    });

    // Watch for changes in the query result
    let odd = false;
    
    watch(() => inventoryResult.value, (newResult) => {
      let thisgroupheader = '';
      if (!loadingInventory.value && newResult) {
        // console.log({newResult})
        const products = newResult.stockTransactionV2machineInventory.channelInfo.filter(r => r.product)
        // Group products by category, origin
        const grouped = products.reduce((acc, r) => {
          if (r.productId) {
            const groupKey = `${r.product.category}${r.product.origin}`;
            if (!acc[groupKey]) acc[groupKey] = [];
            acc[groupKey].push(r);
          }
          return acc;
        }, {});
        // console.log({ grouped })
        // Convert grouped object to array and sort by groupKey
        const sortedGroups = Object.keys(grouped)
          .map(String)
          .sort((a, b) => a - b)
          .map(groupKey => grouped[groupKey]);
        // Sort each group by channel in ascending order
        sortedGroups.forEach((group) => {
          // console.log(group);
          group.sort((a, b) => a.channel - b.channel);
        })
        // console.log({sortedGroups})
        // Map over sorted groups to get the final array with the required structure
        const productsSorted = sortedGroups.flatMap(group => group.map((r) => {
            odd = !odd;
            if (!r.product.texts.length) return false;
            let productText = r.product.texts[0].name;
            if (!productText || productText == '') {
              productText = r.product.texts[1].name;
            }
            if (!productText || productText == '') {
              `${r.product.id} * MISSING *`
            }
            const res = {
              machineId: props.machineId,
              channel: r.channel,
              productId: r.productId,
              productName: productText,
              category: r.product.category,
              origin: r.product.origin,
              groupheader: `${r.product.category}${r.product.origin}` !== thisgroupheader ? `${r.product.category}${r.product.origin}` : '',
              balance: r.balance,
              spoil: 0,
              moveout: 0,
              resupply: 0,
              movein: 0,
              newBalance: r.balance,
              oldBalance: r.balance,
              odd: odd,
              dirty: false,
              spoilDirty: false,
              resupplyDirty: false,
              newLine: false,
              setArchive: false,
            };
            thisgroupheader = `${r.product.category}${r.product.origin}`;
            return res;
          })).filter(Boolean);      
          // console.log({productsSorted})
          inventoryLines.value = productsSorted;
      }
    });
    watch(() => menuItemsResult.value, (newMenuItems) => {
      if (!loadingMenuItems.value && newMenuItems) {
        menuItemProducts.value = newMenuItems.menuItemsByMachineId.map( m => m.product.id );
        menuItemProductOptions.value = newMenuItems.menuItemsByMachineId.map((m) => {
          let productText = m.product.texts[0].name;
          if (!productText || productText == '') {
            productText = m.product.texts[1].name;
          }
          if (!productText || productText == '') {
            `${m.product.id} * MISSING *`
          }
          return {
            value: m.product.id,
            label: productText,
            origin: m.product.origin,
            category: m.product.category,
          }
        })
      }
    })
    watch(() => machineResult.value, (newMachine) => {
      if (!loadingMachine.value && newMachine) {
        machine.value = newMachine.machineById;
      }
    })
    refetch({ machineId })
    refetchMenuItems({ input: { machineId: machineId }})
    return {
      showEmptyChannels,
      machine,
      savingInventory,
      saveError,
      saveMessage,
      loadingInventory,
      errorInventory,
      inventoryLines,
      currentPage,
      inventoryResult,
      driverId,
      menuItemProducts,
      menuItemProductOptions,
      addingChannel,
      newChannel,
      addChannelInput,
      addChannel,
      addingChannel,
      addChannelError,
      addChannelMessage,
      abortAddChannel,
      newProduct,
      newRefill,
      newMoveIn,
      archiveChannel,
      archivingChannel,
      archiveMachineChannel,
      archiveMachineChannelInput,
      archiveChannelError,
      archiveChannelMessage,
      abortArchiveMachineChannel,
      updateEverythingForOneChannel,
      addingMenuItem,
      addMenuItemError,
      addMenuItemOverridePrice,
      addMenuItemProduct,
      multilog,
      logInventoryAction
    };
  },
  methods: {
    selectInput(event) {
      event.target.select();
    },
    updateSpoilFields(fieldName, value, index) {
      // Convert the input value to a number. If the conversion fails, default to 0.
      const newValue = Number(value) || 0;
      this.inventoryLines[index][fieldName] = newValue;
      this.inventoryLines[index].spoilDirty = true;
      this.inventoryLines[index].newBalance = 
        parseInt(this.inventoryLines[index].oldBalance) -
        (parseInt(this.inventoryLines[index].spoil) +
        parseInt(this.inventoryLines[index].moveout)
      );
    },
    updateSpoilBalance(value, index) {
      // Convert the input value to a number. If the conversion fails, default to 0.
      const newValue = Number(value) || 0;
      this.inventoryLines[index].newBalance = newValue;
      this.inventoryLines[index].spoilDirty = true;
    },
    updateResupplyFields(fieldName, value, index) {
      // Convert the input value to a number. If the conversion fails, default to 0.
      const newValue = Number(value) || 0;
      this.inventoryLines[index][fieldName] = newValue;
      this.inventoryLines[index].resupplyDirty = true;
    },
    cancelChanges() {
      this.savingInventory = false;
      this.currentPage = 0;
      this.$emit('cancelled');
    },
    sortInventoryLines() {
      this.inventoryLines.sort((a, b) => {
        // Sort by channel
        if (a.channel < b.channel) {
          return -1;
        }
        if (a.channel > b.channel) {
          return 1;
        }
        // If Channel is the same, sort by newLine
        const newLineNumberA = a.newLine ? 0 : 1;
        const newLineNumberB = b.newLine ? 0 : 1;
        if (newLineNumberA < newLineNumberB) {
          return 1;
        }
        if (newLineNumberA > newLineNumberB) {
          return -1;
        }
        return 0;
      });
    },
    async saveChanges() {
      this.savingInventory = true;
      this.sortInventoryLines()

      // console.log({ inventoryLines: this.inventoryLines })

      for(const line of this.inventoryLines) {
        if (!line.spoilDirty && !line.resupplyDirty && line.setArchive !== 1 && line.newLine !== true) {
          continue;
        }
        this.savingChannel = line.channel;
        const input = {
          machineId: this.machineId,
          driverId: this.driverId,
          productId: line.productId,
          channel: parseInt(line.channel),
          spoilDirty: line.spoilDirty,
          spoil: parseInt(line.spoil),
          newBalance: parseInt(line.newBalance),
          resupplyDirty: line.resupplyDirty,
          resupply: parseInt(line.resupply),
          movein: parseInt(line.movein),
          moveout: parseInt(line.moveout),
          archived: line.setArchive ? 1 : 0,
          ref: '',
        }
        try {
          const res = await this.updateEverythingForOneChannel({ input });
        } catch(e) {
          const err = {
            msg: `Could not update channel ${line.channel}, please make sure you have Internet connection and try again. (${e.message})`,
            err: e
          }
          this.saveError = true;
          this.saveMessage = `${err.msg} ${e.message}`;
          this.savingInventory = false;
          this.savingChannel = 0;
          return false;
        }
        this.logInventoryAction('SaveInventory',JSON.stringify(input));
        this.savingChannel = 0;
      }

      this.savingInventory = false;
      this.$emit('saved');
    },
    async nextPage() {
      this.currentPage = 1;
      this.savingInventory = false;
    },
  }
}
</script>
<style scoped>
.inventory-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.inventory-row:nth-of-type(odd) {
  background-color: #c8e6c9!important
}
.inventory-channel {
  flex: 1 1 10%;
  padding: 0.5rem;
  box-sizing: border-box;
}
.inventory-item {
  flex: 1 1 25%;
  padding: 0.5rem;
  box-sizing: border-box;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-content {
  text-align: center;
  color: white;
}

.header-row, .data-row {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  margin-bottom: 1rem;
}

.header-item, .data-item {
  flex: 1 1 25%; /* Adjusted to fit 4 columns */
  padding: 0.5rem;
  box-sizing: border-box;
}
.header-item {
  text-align: right;
}

.category-header {
  width: 100%;
  padding: 0.5rem;
  background-color: #7db57e;
  font-weight: bold;
  margin-bottom: 2px;
}

.input-label {
  display: none;
}

.header-row:nth-of-type(odd) {
  background-color: #5d8d5e !important;
}
.balance-value {
  width: 100%;
}
.bg-green-1 {
  color: white !important;
  background-color: #1b5e20 !important;
}

@media (max-width: 600px) {
  .header-row {
    display: none;
  }
  .header-item:nth-child(n+2), .data-item:nth-child(n+2) {
    flex: 1 1 100%; /* Wrap after the first item */
  }
  .data-item {
    display: flex;
  }
  .input-label {
    display: inline-block;
    width: 50%; /* Adjust as needed */
  }
  .q-input {
    display: inline-block;
    flex: 1 1 50%; /* Make input fields take up 50% of their surrounding div */
  }
  .balance-value {
    display: inline-block;
    width: 50%; /* Adjust as needed */
  }
}
</style>
