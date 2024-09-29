const mongoose = require("mongoose");
const inventoryModel = require("../models/inventoryModel");
const userModel = require("../models/userModel");

// CREATE INVENTORY
const createInventoryController = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Validation
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ success: false, message: "User Not Found" });
    }

    // Set hospital ID for organization or hospital roles
    if (role === "organization" || role === "hospital") {
      req.body.hospital = user._id; // Set hospital ID
    } else {
      // Additional checks for other roles (e.g., "donar")
      if (req.body.inventoryType === "out") {
        const requestedBloodGroup = req.body.bloodGroup;
        const requestedQuantityOfBlood = req.body.quantity;
        const organisation = new mongoose.Types.ObjectId(req.body.userId); // Ensure this userId is correct

        // Calculate Blood Quantity
        const totalInOfRequestedBlood = await inventoryModel.aggregate([
          {
            $match: {
              organisation,
              inventoryType: "in",
              bloodGroup: requestedBloodGroup,
            },
          },
          {
            $group: {
              _id: "$bloodGroup",
              total: { $sum: "$quantity" },
            },
          },
        ]);

        const totalIn = totalInOfRequestedBlood[0]?.total || 0;

        const totalOutOfRequestedBloodGroup = await inventoryModel.aggregate([
          {
            $match: {
              organisation,
              inventoryType: "out",
              bloodGroup: requestedBloodGroup,
            },
          },
          {
            $group: {
              _id: "$bloodGroup",
              total: { $sum: "$quantity" },
            },
          },
        ]);

        const totalOut = totalOutOfRequestedBloodGroup[0]?.total || 0;

        // Calculate available quantity 
        const availableQuantityOfBloodGroup = totalIn - totalOut;

        // Quantity validation
        if (availableQuantityOfBloodGroup < requestedQuantityOfBlood) {
          return res.status(400).send({
            success: false,
            message: `Only ${availableQuantityOfBloodGroup} ML of ${requestedBloodGroup.toUpperCase()} is available`,
          });
        }

        req.body.hospital = user._id; // Set hospital ID for "out" requests
      } else {
        req.body.donar = user._id; // Set donor ID for "in" requests
      }
    }

    // Ensure organization ID is set
    req.body.organisation = user._id; // Assuming the user is associated with the organization

    // Save record
    const inventory = new inventoryModel(req.body);
    await inventory.save();
    return res.status(201).send({
      success: true,
      message: "New Blood Record Added",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      success: false,
      message: "Error In Create Inventory API",
      error: error.message,
    });
  }
};


// GET ALL BLOOD RECORDS
const getInventoryController = async (req, res) => {
  try {
    const inventory = await inventoryModel
      .find({ organisation: req.body.userId })
      .populate("donar")
      .populate("hospital")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "Get all records successfully",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Get All Inventory",
      error,
    });
  }
};

// GET HOSPITAL BLOOD RECORDS
const getInventoryHospitalController = async (req, res) => {
  try {
    const inventory = await inventoryModel
      .find(req.body.filters)
      .populate("donar")
      .populate("hospital")
      .populate("organisation")
      .sort({ createdAt: -1 });
    return res.status(200).send({
      success: true,
      message: "Get hospital consumer records successfully",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Get Consumer Inventory",
      error,
    });
  }
};

// GET BLOOD RECORD OF 3
const getRecentInventoryController = async (req, res) => {
  try {
    // Fetch all inventory records regardless of the user's organization
    const inventory = await inventoryModel
      .find({})
      .limit(1000)
      .sort({ createdAt: -1 });
      
    return res.status(200).send({
      success: true,
      message: "Recent Inventory Data",
      inventory,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Recent Inventory API",
      error,
    });
  }
};


// GET DONOR RECORDS
const getDonarsController = async (req, res) => {
  try {
    // Find distinct donor IDs from the inventory
    const donorId = await inventoryModel.distinct("donar");

    // Fetch all donor details based on the collected IDs
    const donars = await userModel.find({ _id: { $in: donorId } });

    return res.status(200).send({
      success: true,
      message: "Donar Records Fetched Successfully",
      donars,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error in Donar records",
      error,
    });
  }
};

// GET HOSPITAL RECORDS
const getHospitalController = async (req, res) => {
  try {
    // Find distinct hospital IDs from the inventory
    const hospitalId = await inventoryModel.distinct("hospital");

    // Fetch all hospital details based on the collected IDs
    const hospitals = await userModel.find({ _id: { $in: hospitalId } });

    return res.status(200).send({
      success: true,
      message: "Hospitals Data Fetched Successfully",
      hospitals,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Get Hospital API",
      error,
    });
  }
};

// GET ORGANISATION PROFILES FOR USERS (Donors and Hospitals)
const getOrgnaisationController = async (req, res) => {
  try {
    const userId = req.body.userId; // Get the user ID (donor or hospital)

    // Determine the role of the user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      });
    }

    let organisations;

    if (user.role === "donar") {
      // Fetch distinct organisations associated with the donor
      const orgId = await inventoryModel.distinct("organisation", { donar: userId });
      organisations = await userModel.find({ _id: { $in: orgId } });
    } else if (user.role === "hospital") {
      // Fetch distinct organisations associated with the hospital
      const orgId = await inventoryModel.distinct("organisation", { hospital: userId });
      organisations = await userModel.find({ _id: { $in: orgId } });
    } else {
      return res.status(403).send({
        success: false,
        message: "Unauthorized Role",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Organisation Data Fetched Successfully",
      organisations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Fetching Organisation Data",
      error,
    });
  }
};





// Export all controllers using object shorthand
module.exports = {
  createInventoryController,
  getInventoryController,
  getDonarsController,
  getHospitalController,
  getOrgnaisationController,
  getInventoryHospitalController,
  getRecentInventoryController,
};
