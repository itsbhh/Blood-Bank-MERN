import React from "react";
import Layout from "../../components/shared/Layout/Layout";
import { useSelector } from "react-redux";

const AdminHome = () => {
  const { user } = useSelector((state) => state.auth);
  return (
    <Layout>
      <div className="container">
        <div className="d-flex flex-column mt-4">
          <h1>
            Welcome Admin <i className="text-success">{user?.name}</i>
          </h1>
          <h3>Manage Blood Bank App</h3>
          <hr />
          <p>
            Welcome to the Blood Bank Management System. As an administrator, you play a crucial role in ensuring the smooth operation of our blood bank. This platform allows you to manage blood donations, track inventory, and oversee donor information effectively.

            Here, you can monitor real-time data on blood stock levels, schedule donation drives, and generate reports to analyze trends and make informed decisions. Our goal is to streamline operations and enhance the overall efficiency of the blood bank to better serve the community.

            If you have any questions or need assistance, our support team is always available to help you with any issues or queries. Thank you for your dedication and hard work in managing this vital resource.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminHome;
