const inventoryModel = require("../models/inventoryModel");
const mongoose = require("mongoose");

// GET BLOOD DATA
const bloodGroupDetailsContoller = async (req, res) => {
  try {
    const bloodGroups = ["O+", "O-", "AB+", "AB-", "A+", "A-", "B+", "B-"];
    const bloodGroupData = [];

    // Get blood data for all blood groups
    await Promise.all(
      bloodGroups.map(async (bloodGroup) => {
        // Count TOTAL IN
        const totalIn = await inventoryModel.aggregate([
          {
            $match: {
              bloodGroup: bloodGroup,
              inventoryType: "in",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$quantity" },
            },
          },
        ]);

        // Count TOTAL OUT
        const totalOut = await inventoryModel.aggregate([
          {
            $match: {
              bloodGroup: bloodGroup,
              inventoryType: "out",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$quantity" },
            },
          },
        ]);

        // Calculate available blood
        const availabeBlood = 
          (totalIn[0]?.total || 0) - (totalOut[0]?.total || 0);

        // Push data
        bloodGroupData.push({
          bloodGroup,
          totalIn: totalIn[0]?.total || 0,
          totalOut: totalOut[0]?.total || 0,
          availabeBlood,
        });
      })
    );

    return res.status(200).send({
      success: true,
      message: "Blood Group Data Fetched Successfully",
      bloodGroupData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      message: "Error In Blood Group Data Analytics API",
      error,
    });
  }
};

module.exports = { bloodGroupDetailsContoller };
