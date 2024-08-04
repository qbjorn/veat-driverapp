<template>
    <div>
      <div :key="`${machineId}-${machineName}`">
        <h5 
          class="q-pt-1 q-pb-1 q-mt-1 q-mb-1 text-primary"
        >
          {{ `${currentPage==0?'Waste':'Refill'} for ${machineName} ${machine.isfridge===1?'(fridge)':'(machine)'}` }}
        </h5>
      </div>
      <div v-if="loadingInventory">Loading inventory...</div>
      <div v-if="savingInventory">Saving inventory...</div>
      <div v-show="!loadingInventory && !savingInventory">
        <div v-show="currentPage==0">
          <!-- buttons -->
          <div class="row q-mb-md q-pb-md q-mt-0">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn @click="cancelChanges" class="bg-green-2" label="Cancel " />
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="nextPage" color="primary" label="Next >" />
            </div>
          </div>
          <!-- row header -->
          <div class="row">
            <div class="col-1 col-xs-1 text-bold">
              Ch
            </div>
            <div class="col-5 col-xs-5 text-bold">
              Product
            </div>
            <div class="col-2 col-xs-2 q-pr-md text-bold q-text-danger" style="text-align: right;">
              Waste
            </div>
            <div class="col-2 col-xs-2 q-pr-md text-bold q-text-danger" style="text-align: right;">
              Move out
            </div>
            <div class="col-2 col-xs-2 text-bold" style="text-align: right;">
              Stock after waste
            </div>
          </div>

          <!-- Inventory rows-->
          <div
            v-for="inventoryLine in inventoryLines"
            id="inventoryLine.channel"
            class="row"
            :class="inventoryLine.odd ? 'bg-green-1' : ''"
          >
            <!-- Category header -->
            <div  v-if="machine.isfridge && inventoryLine.category !== ''" class="q-pt-md col-12 bg-white"><b>{{ inventoryLine.category }}</b></div>
            <div class="col-1 col-xs-1 q-pt-md q-pr-xs q-pl-xs">
              {{ inventoryLine.channel }}
            </div>
            <div class="col-5 col-xs-5 q-pt-md">
              {{ inventoryLine.productName }}
            </div>
            <div class="col-2 col-xs-2 q-pr-md">
              <q-input v-model="inventoryLine.spoil" @change="setSpoilDirty(inventoryLine);updateBalanceSpoil(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
            </div>
            <div class="col-2 col-xs-2 q-pr-md">
              <q-input v-model="inventoryLine.moveout" @change="setSpoilDirty(inventoryLine);updateBalanceMoveOut(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
            </div>
            <div class="col-2 col-xs-2">
              <q-input v-model="inventoryLine.newBalance" @change="setSpoilDirty(inventoryLine);updateSpoil(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
            </div>
          </div>
          <div class="row q-pb-md q-pt-md q-mt-md">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn @click="cancelChanges" class="bg-green-2" label="Cancel " />
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
              <q-btn @click="cancelChanges" class="bg-green-2" label="Cancel " />
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
              <q-btn @click="saveChanges" :disabled="savingInventory" color="primary" label="Save" />
            </div>
          </div>
          <div class="row">
            <div class="col-1 col-xs-1 text-bold">
              Ch
            </div>
            <div class="col-7 col-xs-7 text-bold">
              Product
            </div>
            <div class="col-2 col-xs-2 text-bold q-text-success" style="text-align: right;">
              Refill
            </div>
            <div class="col-2 col-xs-2 text-bold q-text-success" style="text-align: right;">
              Move in
            </div>
          </div>
          <div
            v-for="inventoryLine in inventoryLines"
            id="inventoryLine.channel"
            class="row q-mb-md"
            :class="inventoryLine.odd ? 'bg-green-1' : ''"
          >
            <!-- Category header -->
            <div  v-if="machine.isfridge === 1 && inventoryLine.category !== ''" class="q-pt-md col-12 bg-white"><b>{{ inventoryLine.category }}</b></div>
            <div class="col-1 col-xs-1 q-pt-md">
              {{ inventoryLine.channel }}
            </div>
            <div class="col-7 col-xs-7 q-py-0 q-pr-md">
              <q-select
                class="q-py-0 q-my-0"
                v-model="inventoryLine.productId"
                :options="menuItemProductOptions"
                :label="void 0"
                :display-value="menuItemProductOptions.find(m => m.value === inventoryLine.productId) ? menuItemProductOptions.find(m => m.value === inventoryLine.productId).label : void 0"
                @change="setResupplyDirty(inventoryLine)"
              >
              </q-select>
            </div>
            <div class="col-2 col-xs-2">
              <q-input v-model="inventoryLine.resupply" @change="setResupplyDirty(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
            </div>
            <div class="col-2 col-xs-2">
              <q-input v-model="inventoryLine.movein" @change="setResupplyDirty(inventoryLine)" input-style="text-align: right" type="text" hide-bottom-space/>
            </div>
          </div>
          <div class="row q-pb-md q-pt-md q-mt-md">
            <div class="col-6 text-left q-pl-0 q-ml-0">
              <q-btn @click="cancelChanges" class="bg-green-2" label="Cancel " />
            </div>
            <div class="col-6 text-right q-pr-0 q-mr-0">
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
    </div>
</template>
<script>
import { ref, watch } from 'vue'
import gql from 'graphql-tag'
import { useQuery, useMutation } from '@vue/apollo-composable'

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


export default {
  name: 'Inventory',
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

    const { mutate: updateMachineAllInventory } = useMutation(UPDATE_MACHINE_ALL_INVENTORY);
    const { mutate: updateMachineAllRefill } = useMutation(UPDATE_MACHINE_ALL_REFILL);

    // Watch for changes in machineId prop
    watch(() => props.machineId, async(newMachineId) => {
      await refetchMachine({ machineByIdId: newMachineId });
      await refetch({ machineId: newMachineId });
      await refetchMenuItems({ input: { machineId: newMachineId }})
    });

    // Watch for changes in the query result
    let odd = false;
    
    watch(() => inventoryResult.value, (newResult) => {
      let thiscat = '';
      if (!loadingInventory.value && newResult) {
        const products = newResult.stockTransactionV2machineInventory.channelInfo.filter(r => r.product)
        // Group products by channel number divided by 10
        const grouped = products.reduce((acc, r) => {
          const groupKey = Math.floor(r.channel / 10);
          if (!acc[groupKey]) acc[groupKey] = [];
          acc[groupKey].push(r);
          return acc;
        }, {});

        // Convert grouped object to array and sort by groupKey in descending order
        const sortedGroups = Object.keys(grouped)
          .map(Number)
          .sort((a, b) => b - a)
          .map(groupKey => grouped[groupKey]);

        // Sort each group by channel in ascending order
        sortedGroups.forEach(group => group.sort((a, b) => a.channel - b.channel));
        // Map over sorted groups to get the final array with the required structure
        const productsSorted = sortedGroups.flatMap(group => group.map((r) => {
            odd = !odd;
            if (!r.product.texts.length) return false;
            const res = {
              machineId: props.machineId,
              channel: r.channel,
              productId: r.productId,
              productName: r.product.texts[0].name ? (r.product.texts[1] ? r.product.texts[1].name : `${r.productId} * MISSING *`) : `${r.productId} * MISSING *`,
              category: r.product.category !== thiscat ? r.product.category : '',
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
            };
            thiscat = r.product.category;
            return res;
          })).filter(Boolean);      


          inventoryLines.value = productsSorted;
      }
    });
    watch(() => menuItemsResult.value, (newMenuItems) => {
      if (!loadingMenuItems.value && newMenuItems) {
        menuItemProducts.value = newMenuItems.menuItemsByMachineId.map( m => m.product.id );
        menuItemProductOptions.value = newMenuItems.menuItemsByMachineId.map((m) => {
          return {
            value: m.product.id,
            label: m.product.texts[0].name
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
      machine,
      savingInventory,
      saveError,
      saveMessage,
      loadingInventory,
      errorInventory,
      inventoryLines,
      updateMachineAllInventory,
      updateMachineAllRefill,
      currentPage,
      inventoryResult,
      driverId,
      menuItemProducts,
      menuItemProductOptions
    };
  },
  methods: {
    updateBalanceSpoil(inventoryLine) {
      console.log('updateBalance', inventoryLine)
      let bal = parseInt(inventoryLine.oldBalance) - (parseInt(inventoryLine.spoil) + parseInt(inventoryLine.moveout));
      if (bal <0) { bal = 0; }
      inventoryLine.newBalance = bal;
    },
    updateBalanceMoveOut(inventoryLine) {
      console.log('updateBalance', inventoryLine)
      let bal = parseInt(inventoryLine.oldBalance) - (parseInt(inventoryLine.spoil) + parseInt(inventoryLine.moveout));
      if (bal <0) { bal = 0; }
      inventoryLine.newBalance = bal;
    },
    updateSpoil(inventoryLine) {
      return true;
      // inventoryLine.spoil = inventoryLine.newBalance - inventoryLine.balance;
    },
    setSpoilDirty(inventoryLine) {
      inventoryLine.spoilDirty = true;
    },
    setResupplyDirty(inventoryLine) {
      inventoryLine.resupplyDirty = true;
    },
    cancelChanges() {
      this.savingInventory = false;
      this.currentPage = 0;
      this.$emit('cancelled');
    },
    async saveChanges() {
      let spoilAndInventoryLines = [];
      let resupplyLines = [];
      this.savingInventory = true;
      for (const line of this.inventoryLines) {
        if (line.spoilDirty) {
          const spoil = parseInt(line.spoil) || 0;
          const moveout = parseInt(line.moveout) || 0;
          const newBalance = parseInt(line.newBalance) || 0;
          const input = {
            channel: line.channel,
            productId: line.productId,  
            spoil: spoil,
            moveout: moveout,
            balance: newBalance,
          }
          spoilAndInventoryLines.push(input)
        }
        if (line.resupplyDirty) {
          const resupply = parseInt(line.resupply) || 0;
          const movein = parseInt(line.movein) || 0;
          const input = {
            channel: line.channel,
            productId: line.productId,
            refill: resupply,
            movein: movein,
          }
          resupplyLines.push(input);
        }
      }
      if (spoilAndInventoryLines.length) {
        const input = {
          machineId: this.machineId,
          who: this.driverId,
          transactionItems: spoilAndInventoryLines,
       }
        try {
          const res = await this.updateMachineAllInventory({ input });
        } catch(e) {

          const err = {
            msg: 'Could not save spoil and inventory, please make sure you have Internet connection and try again.',
            err: e
          }
          this.saveError = true;
          this.saveMessage = err.msg;
          this.savingInventory = false;
          return false;
        }
      }
      if (resupplyLines.length) {
        const input = {
          machineId: this.machineId,
          who: this.driverId,
          refillItems: resupplyLines,
        }
        try {
          const res = await this.updateMachineAllRefill({ input });
        } catch(e) {
          const err = {
            msg: 'Could not save refill, please make sure you have Internet connection and try again.',
            err: e
          }
          this.saveError = true;
          this.saveMessage = err.msg;
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