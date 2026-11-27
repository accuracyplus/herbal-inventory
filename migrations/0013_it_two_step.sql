-- IT purchase requests: the facility's unit head approves first, then Accounts (Sinu, 27 Nov 2026,
-- relayed by the HiFive ID chat: "IT purchase requests (SIM, phone and so on) are approved by the
-- facility's unit head first, then Accounts"). The unit head is read from HiFive ID's facility
-- contacts at the moment of approving; Inventory keeps no list of unit heads.
--
-- A purchase now moves PENDING (with the unit head) -> HEAD_APPROVED (with Accounts) -> APPROVED
-- (IT buys it) -> DONE. Turned down at either step: REJECTED. The unit head's step is kept in the
-- head_* columns; the final decision stays in decided_*.
ALTER TABLE it_requests ADD COLUMN head_by TEXT;
ALTER TABLE it_requests ADD COLUMN head_name TEXT;
ALTER TABLE it_requests ADD COLUMN head_at TEXT;
ALTER TABLE it_requests ADD COLUMN head_note TEXT;
