import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
    ArrowLeft,
    RefreshCw,
    ArrowRight,
    CheckCircle2,
    Clock3,
    WalletCards,
    X,
    AlertCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import { getGroupMembers } from "../api/groupApi";


function Settlements() {

    const { groupId } = useParams();
    const navigate = useNavigate();

    const [settlementData, setSettlementData] = useState(null);
    const [history, setHistory] = useState([]);
    const [members, setMembers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [error, setError] = useState("");

    const [selectedSettlement, setSelectedSettlement] =
        useState(null);

    const [settling, setSettling] = useState(false);

    const [settleError, setSettleError] = useState("");


    const token =
        localStorage.getItem("token");

    const API_URL =
        "http://localhost:5000";


    // =====================================================
    // GET CURRENT LOGGED-IN USER ID FROM JWT
    // =====================================================

    const getCurrentUserId = () => {

        try {

            if (!token) {
                return null;
            }

            const payload =
                token.split(".")[1];

            if (!payload) {
                return null;
            }

            const decoded =
                JSON.parse(
                    atob(
                        payload
                            .replace(/-/g, "+")
                            .replace(/_/g, "/")
                    )
                );

            return Number(
                decoded.userId
            );

        } catch (error) {

            console.error(
                "Failed to decode token:",
                error
            );

            return null;

        }

    };


    const currentUserId =
        getCurrentUserId();


    // =====================================================
    // FETCH CURRENT SETTLEMENTS
    // =====================================================

    const fetchSettlements = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/groups/${groupId}/settlements`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch settlements"
                );

            }


            setSettlementData(data);

        } catch (error) {

            console.error(
                "Settlement fetch error:",
                error
            );

            setError(error.message);

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // FETCH SETTLEMENT HISTORY
    // =====================================================

    const fetchHistory = async () => {

        try {

            setHistoryLoading(true);


            const response = await fetch(
                `${API_URL}/groups/${groupId}/settlements/history`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch settlement history"
                );

            }


            setHistory(
                data.settlements || []
            );

        } catch (error) {

            console.error(
                "History fetch error:",
                error
            );

        } finally {

            setHistoryLoading(false);

        }

    };


    // =====================================================
    // FETCH GROUP MEMBERS
    // =====================================================

    const fetchMembers = async () => {

        try {

            const data =
                await getGroupMembers(groupId);

            setMembers(
                Array.isArray(data)
                    ? data
                    : data.members || []
            );

        } catch (error) {

            console.error(
                "Failed to fetch members:",
                error
            );

        }

    };


    // =====================================================
    // LOAD EVERYTHING
    // =====================================================

    const loadData = async () => {

        await Promise.all([
            fetchSettlements(),
            fetchHistory(),
            fetchMembers(),
        ]);

    };


    useEffect(() => {

        if (!groupId) {
            return;
        }

        loadData();

    }, [groupId]);


    // =====================================================
    // FIND MEMBER
    // =====================================================

    const getMember = (userId) => {

        return members.find(
            (member) =>
                Number(
                    member.id ?? member.user_id
                ) === Number(userId)
        );

    };


    // =====================================================
    // MEMBER NAME
    // =====================================================

    const getMemberName = (userId) => {

        const member =
            getMember(userId);

        return (
            member?.name ||
            member?.full_name ||
            `User #${userId}`
        );

    };


    // =====================================================
    // MEMBER EMAIL
    // =====================================================

    const getMemberEmail = (userId) => {

        const member =
            getMember(userId);

        return (
            member?.email ||
            ""
        );

    };


    // =====================================================
    // INITIAL
    // =====================================================

    const getInitial = (userId) => {

        const name =
            getMemberName(userId);

        return (
            name
                .charAt(0)
                .toUpperCase()
        );

    };


    // =====================================================
    // OPEN SETTLEMENT MODAL
    // =====================================================

    const openSettlementModal = (settlement) => {

        setSettleError("");

        setSelectedSettlement(
            settlement
        );

    };


    // =====================================================
    // CLOSE SETTLEMENT MODAL
    // =====================================================

    const closeSettlementModal = () => {

        if (settling) {
            return;
        }

        setSelectedSettlement(null);

        setSettleError("");

    };


    // =====================================================
    // CONFIRM SETTLEMENT
    // =====================================================

    const confirmSettlement = async () => {

        if (!selectedSettlement) {
            return;
        }


        try {

            setSettling(true);

            setSettleError("");


            const response = await fetch(
                `${API_URL}/groups/${groupId}/settlements`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },

                    body: JSON.stringify({
                        to_user:
                            Number(
                                selectedSettlement.to
                            ),

                        amount:
                            Number(
                                selectedSettlement.amount
                            ),
                    }),
                }
            );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to record settlement"
                );

            }


            // Close modal

            setSelectedSettlement(null);


            // Refresh everything

            await loadData();


        } catch (error) {

            console.error(
                "Settlement error:",
                error
            );

            setSettleError(
                error.message
            );

        } finally {

            setSettling(false);

        }

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="app-shell">

                <Navbar />

                <div className="app-body">

                    <Sidebar />

                    <main className="dashboard">

                        <div className="settlements-loading">

                            <div className="loading-spinner" />

                            <p>
                                Loading settlements...
                            </p>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error) {

        return (

            <div className="app-shell">

                <Navbar />

                <div className="app-body">

                    <Sidebar />

                    <main className="dashboard">

                        <button
                            className="back-button"
                            onClick={() =>
                                navigate(
                                    groupId
                                        ? `/groups/${groupId}`
                                        : "/dashboard"
                                )
                            }
                            style={{ marginBottom: "20px" }}
                        >
                            <ArrowLeft size={17} />
                            Back
                        </button>

                        <div className="settlements-error">

                            <h2>
                                Something went wrong
                            </h2>

                            <p>
                                {error}
                            </p>

                            <button
                                className="primary-button"
                                onClick={loadData}
                            >
                                Try again
                            </button>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    const settlements =
        settlementData?.settlements || [];


    const balances =
        settlementData?.balances || {};


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="app-shell">

            <Navbar />

            <div className="app-body">

                <Sidebar />

                <main className="dashboard">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="settlements-header">

                <div>

                    <button
                        className="back-button settlements-back"
                        onClick={() =>
                            navigate(
                                groupId
                                    ? `/groups/${groupId}`
                                    : "/dashboard"
                            )
                        }
                        title="Back to group"
                    >

                        <ArrowLeft size={16} />

                        <span>
                            Back to group
                        </span>

                    </button>


                    <h1>
                        Settlements
                    </h1>


                    <p>
                        See who owes whom and settle
                        outstanding balances.
                    </p>

                </div>


                <button
                    className="refresh-button"
                    onClick={loadData}
                >

                    <RefreshCw size={16} />

                    Refresh

                </button>

            </div>


            {/* =================================================
                SUGGESTED SETTLEMENTS
            ================================================= */}

            <section className="settlements-section">

                <div className="section-header">

                    <div>

                        <h2>
                            Suggested settlements
                        </h2>

                        <p>
                            Minimum transactions needed
                            to settle the group.
                        </p>

                    </div>


                    <div className="section-icon">

                        <WalletCards size={20} />

                    </div>

                </div>


                {settlements.length === 0 ? (

                    <div className="empty-card">

                        <div className="empty-icon success-icon">

                            <CheckCircle2 size={22} />

                        </div>


                        <h3>
                            All settled
                        </h3>


                        <p>
                            Everyone in this group is
                            currently settled.
                        </p>

                    </div>

                ) : (

                    <div className="settlement-list">

                        {settlements.map(
                            (settlement, index) => {

                                const isCurrentUserDebtor =
                                    Number(
                                        settlement.from
                                    ) ===
                                    Number(
                                        currentUserId
                                    );


                                return (

                                    <div
                                        className="settlement-card"
                                        key={
                                            `${settlement.from}-${settlement.to}-${index}`
                                        }
                                    >


                                        {/* FROM USER */}

                                        <div className="settlement-person">

                                            <div className="settlement-avatar">

                                                {getInitial(
                                                    settlement.from
                                                )}

                                            </div>


                                            <div>

                                                <strong>
                                                    {getMemberName(
                                                        settlement.from
                                                    )}
                                                </strong>


                                                <span>
                                                    {getMemberEmail(
                                                        settlement.from
                                                    )}
                                                </span>

                                            </div>

                                        </div>


                                        {/* ARROW */}

                                        <div className="settlement-arrow">

                                            <ArrowRight
                                                size={19}
                                            />

                                        </div>


                                        {/* TO USER */}

                                        <div className="settlement-person">

                                            <div className="settlement-avatar">

                                                {getInitial(
                                                    settlement.to
                                                )}

                                            </div>


                                            <div>

                                                <strong>
                                                    {getMemberName(
                                                        settlement.to
                                                    )}
                                                </strong>


                                                <span>
                                                    {getMemberEmail(
                                                        settlement.to
                                                    )}
                                                </span>

                                            </div>

                                        </div>


                                        {/* AMOUNT */}

                                        <div className="settlement-amount">

                                            <span>
                                                Amount
                                            </span>


                                            <strong>
                                                ₹
                                                {Number(
                                                    settlement.amount
                                                ).toFixed(2)}
                                            </strong>

                                        </div>


                                        {/* ACTION */}

                                        {isCurrentUserDebtor ? (

                                            <button
                                                className="settle-button"
                                                onClick={() =>
                                                    openSettlementModal(
                                                        settlement
                                                    )
                                                }
                                            >
                                                Settle
                                            </button>

                                        ) : (

                                            <div className="waiting-payment">

                                                <Clock3
                                                    size={15}
                                                />

                                                <span>
                                                    Awaiting payment
                                                </span>

                                            </div>

                                        )}

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}

            </section>


            {/* =================================================
                CURRENT BALANCES
            ================================================= */}

            <section className="settlements-section">

                <div className="section-header">

                    <div>

                        <h2>
                            Current balances
                        </h2>

                        <p>
                            Positive balances receive money.
                            Negative balances owe money.
                        </p>

                    </div>

                </div>


                <div className="balance-list">

                    {Object.entries(
                        balances
                    ).map(
                        ([userId, balance]) => {

                            const numericBalance =
                                Number(balance);


                            const isPositive =
                                numericBalance > 0;


                            const isNegative =
                                numericBalance < 0;


                            return (

                                <div
                                    className="balance-card"
                                    key={userId}
                                >

                                    <div className="balance-user">

                                        <div className="balance-avatar">

                                            {getInitial(
                                                userId
                                            )}

                                        </div>


                                        <div>

                                            <strong>
                                                {getMemberName(
                                                    userId
                                                )}
                                            </strong>


                                            <span>

                                                {isPositive
                                                    ? "Gets money"
                                                    : isNegative
                                                        ? "Owes money"
                                                        : "Settled"}

                                            </span>

                                        </div>

                                    </div>


                                    <div
                                        className={
                                            isPositive
                                                ? "balance-positive"
                                                : isNegative
                                                    ? "balance-negative"
                                                    : "balance-zero"
                                        }
                                    >

                                        {isPositive
                                            ? "+"
                                            : ""}

                                        ₹
                                        {Math.abs(
                                            numericBalance
                                        ).toFixed(2)}

                                    </div>

                                </div>

                            );

                        }
                    )}

                </div>

            </section>


            {/* =================================================
                SETTLEMENT HISTORY
            ================================================= */}

            <section className="settlements-section">

                <div className="section-header">

                    <div>

                        <h2>
                            Settlement history
                        </h2>


                        <p>
                            Payments already recorded
                            for this group.
                        </p>

                    </div>


                    <Clock3 size={20} />

                </div>


                {historyLoading ? (

                    <div className="empty-card">

                        <p>
                            Loading history...
                        </p>

                    </div>

                ) : history.length === 0 ? (

                    <div className="empty-card">

                        <div className="empty-icon">
                            ₹
                        </div>


                        <h3>
                            No settlements yet
                        </h3>


                        <p>
                            Completed payments will
                            appear here.
                        </p>

                    </div>

                ) : (

                    <div className="history-list">

                        {history.map(
                            (settlement) => (

                                <div
                                    className="history-card"
                                    key={settlement.id}
                                >

                                    <div className="history-main">

                                        <div className="history-avatar">

                                            {settlement
                                                .from_user_name
                                                ?.charAt(0)
                                                ?.toUpperCase()}

                                        </div>


                                        <div>

                                            <div className="history-names">

                                                <strong>
                                                    {
                                                        settlement.from_user_name
                                                    }
                                                </strong>


                                                <ArrowRight
                                                    size={15}
                                                />


                                                <strong>
                                                    {
                                                        settlement.to_user_name
                                                    }
                                                </strong>

                                            </div>


                                            <span>

                                                {new Date(
                                                    settlement.created_at
                                                ).toLocaleDateString(
                                                    "en-IN",
                                                    {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                    }
                                                )}

                                            </span>

                                        </div>

                                    </div>


                                    <strong className="history-amount">

                                        ₹
                                        {Number(
                                            settlement.amount
                                        ).toFixed(2)}

                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                )}

            </section>


            {/* =================================================
                CONFIRM SETTLEMENT MODAL
            ================================================= */}

            {selectedSettlement && (

                <div
                    className="settlement-modal-overlay"
                    onClick={closeSettlementModal}
                >

                    <div
                        className="settlement-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* MODAL HEADER */}

                        <div className="settlement-modal-header">

                            <div>

                                <div className="modal-icon">

                                    <WalletCards size={20} />

                                </div>

                            </div>


                            <button
                                className="modal-close-button"
                                onClick={
                                    closeSettlementModal
                                }
                                disabled={settling}
                            >

                                <X size={20} />

                            </button>

                        </div>


                        <h2>
                            Confirm settlement
                        </h2>


                        <p className="modal-description">
                            Confirm that you have paid this
                            amount to settle your balance.
                        </p>


                        {/* PAYMENT SUMMARY */}

                        <div className="payment-summary">

                            <div className="payment-user">

                                <div className="settlement-avatar">

                                    {getInitial(
                                        selectedSettlement.from
                                    )}

                                </div>


                                <div>

                                    <span>
                                        Paying
                                    </span>

                                    <strong>
                                        {getMemberName(
                                            selectedSettlement.from
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <ArrowRight
                                size={20}
                                className="payment-arrow"
                            />


                            <div className="payment-user">

                                <div className="settlement-avatar">

                                    {getInitial(
                                        selectedSettlement.to
                                    )}

                                </div>


                                <div>

                                    <span>
                                        Receiving
                                    </span>

                                    <strong>
                                        {getMemberName(
                                            selectedSettlement.to
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </div>


                        {/* AMOUNT */}

                        <div className="confirmation-amount">

                            <span>
                                Settlement amount
                            </span>

                            <strong>

                                ₹
                                {Number(
                                    selectedSettlement.amount
                                ).toFixed(2)}

                            </strong>

                        </div>


                        {/* ERROR */}

                        {settleError && (

                            <div className="settlement-modal-error">

                                <AlertCircle size={17} />

                                <span>
                                    {settleError}
                                </span>

                            </div>

                        )}


                        {/* ACTIONS */}

                        <div className="settlement-modal-actions">

                            <button
                                className="modal-cancel-button"
                                onClick={
                                    closeSettlementModal
                                }
                                disabled={settling}
                            >
                                Cancel
                            </button>


                            <button
                                className="modal-confirm-button"
                                onClick={
                                    confirmSettlement
                                }
                                disabled={settling}
                            >

                                {settling
                                    ? "Recording..."
                                    : "Confirm payment"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

                </main>

            </div>

        </div>

    );

}


export default Settlements;