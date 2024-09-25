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
    };
  },
  methods: {
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
        // If productId is the same, sort by channel
        if (a.channel < b.channel) {
          return -1;
        }
        if (a.channel > b.channel) {
          return 1;
        }
        // If productId and channel are the same, sort by newLine
        const newLineNumberA = a.newLine ? 0 : 1;
        const newLineNumberB = b.newLine ? 0 : 1;
        if (newLineNumberA < newLineNumberA) {
          return -1;
        }
        if (newLineNumberA > newLineNumberA) {
          return 1;
        }
        return 0;
      });
    },
    async saveChanges() {
      this.savingInventory = true;
      this.sortInventoryLines()

      for(const line of this.inventoryLines) {
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
          console.log(`Saving line ${line.channel} ${line.productName} ${line.newBalance}`);
          const res = await this.updateEverythingForOneChannel({ input });
          console.log(`Saved line ${line.channel} ${line.productName} ${line.newBalance}`);
        } catch(e) {
          const err = {
            msg: `Could not update channel ${line.channel}, please make sure you have Internet connection and try again. (${e.message})`,
            err: e
          }
          this.saveError = true;
          this.saveMessage = `${err.msg} ${e.message}`;
          this.savingInventory = false;
          return false;
        }

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