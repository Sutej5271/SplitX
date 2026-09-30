import { ArrowRight, Users } from "lucide-react";

const GroupCard = ({ group, onClick }) => {
    return (
        <button
            className="group-card"
            onClick={() => onClick(group)}
        >
            <div className="group-icon">
                <Users size={21} />
            </div>

            <div className="group-card-content">
                <h3>{group.name}</h3>

                {group.members_count != null && (
                    <span>
                        {group.members_count} member{group.members_count !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            <ArrowRight
                size={19}
                className="group-arrow"
            />
        </button>
    );
};

export default GroupCard;