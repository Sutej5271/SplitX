const SummaryCard = ({
    title,
    amount,
    description,
    type = "neutral",
    currency = "₹",
}) => {
    return (
        <div className={`summary-card ${type}`}>
            <div className="summary-card-top">
                <span>{title}</span>
            </div>

            <div className="summary-amount">
                {currency}{Number(amount || 0).toFixed(2)}
            </div>

            <p>{description}</p>
        </div>
    );
};

export default SummaryCard;