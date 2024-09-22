<template>
    <div>
      <div :key="`${machineId}-${machineName}`">
        <h6
          class="q-pt-1 q-pb-1 q-mt-1 q-mb-1 text-primary"
        >
          <span class="q-pt-lg">{{ `${currentPage==0?'Waste':'Refill'} for ${machineName} ${machine.isfridge===1?'(Fr)':'(Ma)'}` }}</span>
          <span style="float: right">Show empty <q-checkbox v-model="showEmptyChannels" /></span>
        </h6>
        
      </div>
      <div v-if="loadingInventory">
        <q-spinner
          class="mr-2"
          color="primary"
          size="3em"
          :thickness="2"
        />Loading inventory...
      </div>
      <div v-if="savingInventory">
        <q-spinner
          class="mr-2"
          color="primary"
          size="3em"
          :thickness="2"
        />Saving inventory...
      </div>
      <div v-show="!loadingInventory && !savingInventory">
        <div v-show="currentPage==0">
          <!-- buttons -->
          <div class="row q-mb-md q-pb-md q-mt-0">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn icon="cancel" @click="cancelChanges" class="bg-green-2" label="Cancel" />
              
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="nextPage" color="primary" label="Next >" />
            </div>
          </div>
          <!-- row header -->
          <div class="row">
            <div class="col-1 text-bold">
              Ch
            </div>
            <div class="col-7 text-bold">
              Product
            </div>
            <div class="col-1 text-bold q-text-danger" style="text-align: right;">
              Waste
            </div>
            <div class="col-1 q-pl-md text-bold q-text-danger" style="text-align: right;">
              Out
            </div>
            <div class="col-1 q-pl-md text-bold" style="text-align: right;">
              Left
            </div>
            <div class="col-1 q-pr-md"></div>
          </div>
          <!-- Inventory rows-->
          <div
            v-for="inventoryLine, index in inventoryLines"
            id="inventoryLine.channel"
            class="row"
            :class="`${inventoryLine.odd ? 'bg-green-1' : ''}}`"
          >
            <!-- Category header -->
            <div
              v-if="inventoryLine.groupheader !== ''"
              style="text-decoration: none !important"
              class="q-pt-md col-12 bg-white text-black"
            >
              <b>{{ inventoryLine.category }} ({{ inventoryLine.origin }})</b>
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-1 q-pt-md q-pr-xs q-pl-xs"
              :class="`${inventoryLine.setArchive ? 'text-bold text-red text-strike' : ''}`"
            >
              {{ inventoryLine.channel }}.
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-7 q-pt-md"
              :class="`${inventoryLine.setArchive ? 'text-bold text-red text-strike' : ''}`"
            >
              {{ inventoryLine.productName }}
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-1 text-right"
              :class="`${inventoryLine.setArchive ? 'text-bold text-red text-strike' : ''}`"
            >
              <q-input
                v-model="inventoryLine.spoil"
                @update:model-value="value => updateSpoilFields('spoil', value, index)"
                input-style="text-align: right"
                type="text"
                hide-bottom-space
              />
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-1 q-pl-md text-right"
              :class="`${inventoryLine.setArchive ? 'text-bold text-red text-strike' : ''}`"
            >
              <q-input
                v-model="inventoryLine.moveout"
                @update:model-value="value => updateSpoilFields('moveout', value, index)"
                input-style="text-align: right"
                type="text"
                hide-bottom-space
              />
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-1 q-pl-sm text-right"
              :class="`${inventoryLine.setArchive ? 'text-bold text-red text-strike' : ''}`"
            >
              <q-input
                v-model="inventoryLine.newBalance"
                @update:model-value="value => updateSpoilBalance( value, index)"
                input-class="text-bold"
                input-style="text-align: right"
                type="text"
                hide-bottom-space
              />
            </div>
            <div v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"  style="text-align: right;" class="col-1 col-xs-1 q-mt-sm">
              <q-btn
                v-if="inventoryLine.newBalance == 0 && inventoryLine.setArchive === false"
                @click="archiveMachineChannelInput(inventoryLine.channel)"
                title="Remove channel"
                class="q-mt-0"
                flat
                outline
                icon="delete"
              />
              <q-btn
                v-if="inventoryLine.newBalance == 0 && inventoryLine.setArchive === true"
                @click="inventoryLine.setArchive=false"
                title="Undo remove channel"
                class="q-mt-0"
                flat
                outline
                icon="undo"
              />
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
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn @click="currentPage = 0" class="bg-green-2" label="< Back" />
              <!-- <q-btn @click="addingMenuItem=true" outline class="border-green-2 q-ml-md" label="+ Menu item" /> -->
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn class="bg-green-2 q-mr-md" @click="addChannelInput" :disabled="savingInventory" label="+ Channel" />
              <q-btn @click="saveChanges" :disabled="savingInventory" color="primary" label="Save" />
            </div>
          </div>
          <div class="row">
            <div class="col-1 text-bold">
              Ch
            </div>
            <div class="col-7 text-bold">
              Product
            </div>
            <div class="col-1 text-bold text-right q-text-success">
              Refill
            </div>
            <div class="col-1 text-bold q-text-success text-right">
              <span class="q-ml-md">Move</span>
            </div>
            <div class="col-1 text-bold q-text-success text-right">
              <span class="q-ml-md">Bal</span>
            </div>            
          </div>
          <div
            v-for="inventoryLine,index in inventoryLines"
            id="inventoryLine.channel"
            class="row q-mb-md"
            :class="inventoryLine.odd ? 'bg-green-1' : ''"
          >
            <!-- New channel header -->
            <div v-if="inventoryLine.newLine" class="q-pt-md col-12 bg-white text-green"><b>ADDED CHANNEL</b></div>
            <!-- Category header -->
            <div v-if="inventoryLine.groupheader !== ''" class="q-pt-md col-12 bg-white"><b>{{ inventoryLine.category }} ({{ inventoryLine.origin }})</b></div>
            <div v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine" class="col-1 q-pt-md">
              <div
                :class="`${inventoryLine.setArchive === true ? 'text-red text-bold text-strike' : ''}`"
              >
                {{ inventoryLine.channel }}.
              </div>
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-7 q-py-0 q-pr-md text-left"
              :class="`${inventoryLine.setArchive ? 'text-bold text-red text-strike' : ''}`"
            >
              <div v-if="inventoryLine.setArchive !== true" class="q-pt-md">{{ inventoryLine.productName }}</div>
              <div v-if="inventoryLine.setArchive === true" class="q-pt-md text-red text-strike">{{ inventoryLine.productName }}</div>
            </div>
            <div v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine" class="col-1 text-right">
              <q-input
                v-if="inventoryLine.setArchive !== true"
                v-model="inventoryLine.resupply"
                @update:model-value="value => updateResupplyFields('resupply', value, index)"
                input-style="text-align: right"
                type="text"
                hide-bottom-space
              />
              <div v-if="inventoryLine.setArchive === true" class="q-pt-md text-red text-bold text-strike text-right">{{ inventoryLine.resupply }}</div>
            </div>
            <div v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine" class="col-1">
              <q-input
                v-if="inventoryLine.setArchive !== true"
                v-model="inventoryLine.movein"
                @update:model-value="value => updateResupplyFields('movein', value, index)"
                class="q-ml-sm"
                input-style="text-align: right"
                type="text"
                hide-bottom-space
              />
              <div v-if="inventoryLine.setArchive === true" class="q-pt-md text-red text-bold text-strike text-right">{{ inventoryLine.movein }}</div>
            </div>
            <div
              v-if="inventoryLine.balance > 0 || showEmptyChannels || inventoryLine.newLine"
              class="col-1 text-right"
            >
              <div class="q-pt-md text-bold text-right">{{ inventoryLine.newBalance }}</div>
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
            <q-input v-model="newChannel" label="Channel" type="number" />
          </q-card-section>
          <q-card-section>
            <q-select v-model="newProduct" :options="menuItemProductOptions" label="Product" />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-input v-model="newRefill" label="Refill" type="number" />
          </q-card-section>          <q-card-section class="q-pt-none">
            <q-input v-model="newMoveIn" label="Move In" type="number" />
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
            <q-input v-model="addMenuItemOverridePrice" label="Override price" type="number" />
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
    </div>
</template>
<script>
import { ref, watch } from 'vue'
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
const UPDATE_MACHINE_ALL_INVENTORY = gql`
  mutation UpdateMachineAllInventory($input: megaUpdateMachineAllInventory!) {
    updateMachineAllInventory(input: $input) {
      machineId
    }
  }
`;
const UPDATE_MACHINE_ALL_REFILL = gql`
  mutation UpdateMachineAllRefill($input: megaUpdateMachineAllRefill!) {
    updateMachineAllRefill(input: $input) {
      machineId
    }
  }
`;
const ARCHIVE_MACHINE_CHANNEL = gql`
  mutation ArchiveMachineChannel($input: archiveMachineChannelInput!) {
    archiveMachineChannel(input: $input) 
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


const CREATE_STOCKTRANSACTIONV2 = gql`
  mutation CreateStockTransactionV2($input: StockTransactionV2Input!) {
    createStockTransactionV2(input: $input) {
      id
    }
  }
`;
const CREATE_INVENTORYSTOCKTRANSACTIONV2 = gql`
  mutation CreateInventoryStockTransactionV2($input: StockTransactionV2InventoryInput!) {
    inventoryStockTransactionV2(input: $input) {
      id
    }
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
  },
  data: function() {
    return {
      savingSpoil: false,
      savingResupply: false,
    }
  },
  setup(props) {
    const showEmptyChannels = ref(false)
    const currentPage = ref(0);
    const savingInventory = ref(false);
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
            channel: newChannel.value,
            productId: newProduct.value.value,
            productName: newProduct.value.label,
            category: newProduct.category,
            origin: newProduct.origin,
            groupheader: '',
            balance: 0,
            spoil: 0,
            moveout: 0,
            resupply: newRefill.value,
            movein: newMoveIn.value,
            newBalance: newRefill.value + newMoveIn.value,
            oldBalance: 0,
            odd: false,
            dirty: true,
            spoilDirty: false,
            resupplyDirty: true,
            newLine: true,
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

    const { mutate: updateMachineAllInventory } = useMutation(UPDATE_MACHINE_ALL_INVENTORY);
    const { mutate: updateMachineAllRefill } = useMutation(UPDATE_MACHINE_ALL_REFILL);
    const { mutate: setArchiveMachineChannel } = useMutation(ARCHIVE_MACHINE_CHANNEL);
    const { mutate: createStockTransactionV2 } = useMutation(CREATE_STOCKTRANSACTIONV2);
    const { mutate: createInventoryStockTransactionV2 } = useMutation(CREATE_INVENTORYSTOCKTRANSACTIONV2);

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
      updateMachineAllInventory,
      updateMachineAllRefill,
      setArchiveMachineChannel,
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
      createStockTransactionV2,
      createInventoryStockTransactionV2,
      addingMenuItem,
      addMenuItemError,
      addMenuItemOverridePrice,
      addMenuItemProduct,
    };
  },
  methods: {
    updateSpoilFields(fieldName, value, index) {
      // Convert the input value to a number. If the conversion fails, default to 0.
      const newValue = Number(value) || 0;
      this.inventoryLines[index][fieldName] = newValue;
      this.inventoryLines[index].spoilDirty = true;
      this.inventoryLines[index].newBalance = 
        this.inventoryLines[index].oldBalance -
        (this.inventoryLines[index].spoil +
        this.inventoryLines[index].moveout);
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
        if (a.productId < b.productId) {
          return -1;
        }
        if (a.productId > b.productId) {
          return 1;
        }
        // If productId is the same, sort by channel
        if (a.channel < b.channel) {
          return -1;
        }
        if (a.channel > b.channel) {
          return 1;
        }
        // If productId and channel are the same, sort by newLine
        if (a.newLine < b.newLine) {
          return -1;
        }
        if (a.newLine > b.newLine) {
          return 1;
        }
        return 0;
      });
    },
    async saveChanges() {
      // let spoilAndInventoryLines = [];
      // let resupplyLines = [];
      // let newLines = [];
      this.savingInventory = true;
      this.sortInventoryLines()
      for (const line of this.inventoryLines) {
        if (line.spoilDirty) {
          const moveoutInput = {
            machineId: this.machineId,
            channel: parseInt(line.channel),
            productId: line.productId,
            quantity: parseInt(line.moveout),
            transactionType: 'MOVEOUT',
            transactionTimestamp: null,
            who: this.driverId,
            ref: null,
            archived: 0,
          }
          try {
            const res = await this.createStockTransactionV2({ input: moveoutInput });
          } catch(e) {
            const err = {
              msg: `Could not save MOVE OUT for channel ${line.channel}, please make sure you have Internet connection and try again.`,
              err: e
            }
            this.saveError = true;
            this.saveMessage = `${err.msg} ${e.message}`;
            this.savingInventory = false;
            return false;
          }
          const spoilInput = {
            machineId: this.machineId,
            channel: line.channel,
            productId: line.productId,
            quantity: parseInt(line.spoil),
            transactionType: 'SPOIL',
            transactionTimestamp: null,
            who: this.driverId,
            ref: null,
            archived: 0,
          }
          try {
            const res = await this.createStockTransactionV2({ input: spoilInput });
          } catch(e) {
            const err = {
              msg: `Could not save SPOIL for channel ${line.channel}, please make sure you have Internet connection and try again.`,
              err: e
            }
            this.saveError = true;
            this.saveMessage = `${err.msg} ${e.message}`;
            this.savingInventory = false;
            return false;
          }
          const inventoryInput = {
            machineId: this.machineId,
            channel: parseInt(line.channel),
            productId: line.productId,
            balance: line.newBalance,
            transactionTimestamp: null,
            who: this.driverId,
            ref: null,
          }
          try {
            const res = await this.createInventoryStockTransactionV2({ input: inventoryInput });
          } catch(e) {
            const err = {
              msg: `Could not save INVENTORY for channel ${line.channel}, please make sure you have Internet connection and try again.`,
              err: e
            }
            this.saveError = true;
            this.saveMessage = `${err.msg} ${e.message}`;
            this.savingInventory = false;
            return false;
          }
        }
        // if (line.archiveChannel) {
        //   const archiveInput = {
        //     machineId: this.machineId,
        //     channel: parseInt(line.channel),
        //   }
        //   try {
        //     const res = await this.archiveMachineChannel({ input: archiveInput });
        //   } catch(e) {
        //     const err = {
        //       msg: `Could not archive channel ${line.channel}, please make sure you have Internet connection and try again.`,
        //       err: e
        //     }
        //     this.saveError = true;
        //     this.saveMessage = `${err.msg} ${e.message}`;
        //     this.savingInventory = false;
        //     return false;
        //   }
        // }
        if (line.setArchive === true && line.newBalance === 0) {
              const input = {
                machineId: this.machineId,
                channel: line.channel,
              }
              try {
                await this.setArchiveMachineChannel({ input });
                this.inventoryLines = this.inventoryLines.filter((l) => l.channel !== line.channel);
              } catch(e) {
                console.log({e});
                const err = {
                  msg: `Could not archive channel ${input.channel}.`,
                  err: e
                }
                this.saveError = true;
                this.saveMessage = `${err.msg} ${e.message}`;
                this.savingInventory = false;
                return false;
              }
        }
        // Add new product to channel -done in backend?
        // if (line.newChannel) {
        //   const inventoryNewChannelInput = {
        //     machineId: this.machineId,
        //     channel: parseInt(line.channel),
        //     productId: line.productId,
        //     balance: 0,
        //     transactionTimestamp: null,
        //     who: this.driverId,
        //     ref: null,
        //   }
        //   try {
        //     const res = await this.createInventoryStockTransactionV2({ input: inventoryNewChannelInput });
        //   } catch(e) {
        //     const err = {
        //       msg: `Could not save INVENTORY for Added channel ${line.channel}, please make sure you have Internet connection and try again.`,
        //       err: e
        //     }
        //     this.saveError = true;
        //     this.saveMessage = `${err.msg} ${e.message}`;
        //     this.savingInventory = false;
        //     return false;
        //   }              
        // }        
        if (line.resupplyDirty) {
          if (line.movein != 0) {
            const moveinInput = {
              machineId: this.machineId,
              channel: parseInt(line.channel),
              productId: line.productId,
              quantity: parseInt(line.movein),
              transactionType: 'MOVEIN',
              transactionTimestamp: null,
              who: this.driverId,
              ref: null,
              archived: 0,
            }
            try {
              const res = await this.createStockTransactionV2({ input: moveinInput });
            } catch(e) {
              const err = {
                msg: `Could not save MOVE IN for channel ${line.channel}, please make sure you have Internet connection and try again.`,
                err: e
              }
              this.saveError = true;
              this.saveMessage = `${err.msg} ${e.message}`;
              this.savingInventory = false;
              return false;
            }
           
          }
          if (line.resupply != 0) {
            const resupplyInput = {
              machineId: this.machineId,
              channel: parseInt(line.channel),
              productId: line.productId,
              quantity: parseInt(line.resupply),
              transactionType: 'RESUPPLY',
              transactionTimestamp: null,
              who: this.driverId,
              ref: null,
              archived: 0,
            }
            try {
              const res = await this.createStockTransactionV2({ input: resupplyInput });
            } catch(e) {
              const err = {
                msg: `Could not save RESUPPLY for channel ${line.channel}, please make sure you have Internet connection and try again.`,
                err: e
              }
              this.saveError = true;
              this.saveMessage = `${err.msg} ${e.message}`;
              this.savingInventory = false;
              return false;
            }
          }
        }
      }

      // for (const line of this.inventoryLines) {
      //   if (line.spoilDirty) {
      //     const spoil = parseInt(line.spoil) || 0;
      //     const moveout = parseInt(line.moveout) || 0;
      //     const newBalance = parseInt(line.newBalance) || 0;
      //     const input = {
      //       channel: line.channel,
      //       productId: line.productId.value ? line.productId.value : line.productId, 
      //       spoil: spoil,
      //       moveout: moveout,
      //       balance: newBalance,
      //     }
      //     spoilAndInventoryLines.push(input)
      //   }
      //   // console.log('Checking resupply', {line})
      //   if (line.resupplyDirty && line.newLine === false) {
      //     const resupply = parseInt(line.resupply) || 0;
      //     const movein = parseInt(line.movein) || 0;
      //     // console.log(typeof resupply, typeof movein);
      //     const input = {
      //       channel: parseInt(line.channel),
      //       productId: line.productId.value ? line.productId.value : line.productId,
      //       refill: resupply,
      //       movein: movein,
      //     }
      //     resupplyLines.push(input);
      //   }
      //   if (line.newLine) {
      //     const resupply = parseInt(line.resupply) || 0;
      //     const movein = parseInt(line.movein) || 0;
      //     const input = {
      //       channel: parseInt(line.channel),
      //       productId: line.productId.value ? line.productId.value : line.productId,
      //       refill: resupply,
      //       movein: movein,
      //     }
      //     newLines.push(input);
      //   }
      // }
      // Update spoil and inventory per channel
      // if (spoilAndInventoryLines.length) {
      //   const input = {
      //     machineId: this.machineId,
      //     who: this.driverId,
      //     transactionItems: spoilAndInventoryLines,
      //  }
      //   try {
      //     const res = await this.updateMachineAllInventory({ input });
      //   } catch(e) {
      //     const err = {
      //       msg: 'Could not save spoil and inventory, please make sure you have Internet connection and try again.',
      //       err: e
      //     }
      //     this.saveError = true;
      //     this.saveMessage = `${err.msg} ${e.message}`;
      //     this.savingInventory = false;
      //     return false;
      //   }
      // }
      // // console.log('Resupply', resupplyLines);
      // // Update resupply per channel
      // if (resupplyLines.length) {
      //   // console.log(resupplyLines);
      //   const input = {
      //     machineId: this.machineId,
      //     who: this.driverId,
      //     refillItems: resupplyLines,
      //   }
      //   try {
      //     const res = await this.updateMachineAllRefill({ input });
      //   } catch(e) {
      //     const err = {
      //       msg: 'Could not save refill, please make sure you have Internet connection and try again.',
      //       err: e
      //     }
      //     this.saveError = true;
      //     this.saveMessage = `${err.msg} ${e.message}`;
      //     this.savingInventory = false;
      //     return false;
      //   }          
      // }
      // // Remove "archived" channels with 0 balance
      // for (const line of this.inventoryLines) {
      //   if (line.setArchive === true && line.newBalance === 0) {
      //     // console.log('Checking setArchive', {line})
      //     const input = {
      //       machineId: this.machineId,
      //       channel: line.channel,
      //     }
      //     try {
      //       await this.setArchiveMachineChannel({ input });
      //       this.inventoryLines = this.inventoryLines.filter((l) => l.channel !== line.channel);
      //     } catch(e) {
      //       console.log({e});
      //       const err = {
      //         msg: `Could not archive channel ${input.channel}.`,
      //         err: e
      //       }
      //       this.saveError = true;
      //       this.saveMessage = `${err.msg} ${e.message}`;
      //       this.savingInventory = false;
      //       return false;
      //     }
      //   }
      // }
      // // Add new channels
      // if (newLines.length) {
      //   const input = {
      //     machineId: this.machineId,
      //     who: this.driverId,
      //     refillItems: newLines,
      //   }
      //   try {
      //     const res = await this.updateMachineAllRefill({ input });
      //   } catch(e) {
      //     const err = {
      //       msg: 'Could not save new line(s).',
      //       err: e
      //     }
      //     this.saveError = true;
      //     this.saveMessage = `${err.msg} ${e.message}`;
      //     this.savingInventory = false;
      //     return false;
      //   }          
      // }
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